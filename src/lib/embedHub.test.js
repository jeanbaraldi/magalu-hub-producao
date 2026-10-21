import { describe, expect, it, vi } from "vitest";
import { fetchEmbutido, iniciarReceptorHub, modoEmbutido, origemDoHub, PROTOCOL } from "./embedHub";

const HUB = "https://hub.exemplo.test";
const CHALLENGE = "12345678-1234-1234-1234-123456789abc";
const jwt = (expSeg) => `x.${btoa(JSON.stringify({ exp: expSeg })).replace(/=+$/, "")}.y`;
const valido = () => jwt(Math.floor(Date.now() / 1000) + 3600);
const flush = () => new Promise((r) => setTimeout(r, 0));

function montar() {
  const parent = { postMessage: vi.fn() };
  let ouvir = () => {};
  const win = {
    location: { search: "?hub_embed=1" }, parent,
    addEventListener: (_, fn) => { ouvir = fn; },
    removeEventListener: vi.fn(),
  };
  const auth = { setSession: vi.fn().mockResolvedValue({ error: null }), signOut: vi.fn().mockResolvedValue({ error: null }) };
  const receptor = iniciarReceptorHub({ auth, app: "ml", hubOrigin: HUB, win });
  const receber = (data, extra = {}) =>
    ouvir({ origin: HUB, source: parent, data, ...extra });
  const probe = () => receber({ protocol: PROTOCOL, type: "probe", app: "ml", challenge: CHALLENGE });
  const nonce = () => parent.postMessage.mock.calls[0][0].nonce;
  return { parent, auth, receptor, receber, probe, nonce };
}

describe("receptor do Hub", () => {
  it("responde ready ecoando o challenge, com nonce UUID, só para a origem exata do Hub", () => {
    const { parent, probe } = montar();
    probe();
    expect(parent.postMessage).toHaveBeenCalledTimes(1);
    const [msg, alvo] = parent.postMessage.mock.calls[0];
    expect(alvo).toBe(HUB);
    expect(msg).toMatchObject({ protocol: PROTOCOL, app: "ml", type: "ready", challenge: CHALLENGE });
    expect(msg.nonce).toMatch(/^[a-f0-9-]{36}$/);
  });

  it("ignora origem errada, janela errada, challenge ausente ou app de outro sistema", () => {
    const { parent, receber } = montar();
    const probe = { protocol: PROTOCOL, type: "probe", app: "ml", challenge: CHALLENGE };
    receber(probe, { origin: "https://evil.test" });
    receber(probe, { origin: `${HUB}.evil.test` });
    receber(probe, { source: {} });
    receber({ ...probe, challenge: undefined });
    receber({ ...probe, challenge: "*" });
    receber({ ...probe, app: "dre" });
    receber({ ...probe, protocol: "outro" });
    expect(parent.postMessage).not.toHaveBeenCalled();
  });

  it("aplica session via setSession e responde authenticated com a mesma revisão", async () => {
    const { parent, auth, receber, probe, nonce } = montar();
    probe();
    const token = valido();
    receber({ protocol: PROTOCOL, type: "session", nonce: nonce(), challenge: CHALLENGE, revision: 3, access_token: token, refresh_token: "r" });
    await flush();
    expect(auth.setSession).toHaveBeenCalledWith({ access_token: token, refresh_token: "r" });
    expect(parent.postMessage.mock.calls[1]).toEqual([{ protocol: PROTOCOL, app: "ml", type: "authenticated", nonce: nonce(), challenge: CHALLENGE, revision: 3 }, HUB]);
  });

  it("recusa session sem nonce/challenge certos, revisão repetida ou token perto de vencer", async () => {
    const { parent, auth, receber, probe, nonce } = montar();
    receber({ protocol: PROTOCOL, type: "session", nonce: "x", challenge: CHALLENGE, revision: 1, access_token: valido(), refresh_token: "r" });
    probe();
    const base = { protocol: PROTOCOL, type: "session", nonce: nonce(), challenge: CHALLENGE, refresh_token: "r" };
    receber({ ...base, nonce: "00000000-0000-0000-0000-000000000000", revision: 1, access_token: valido() });
    receber({ ...base, challenge: "00000000-0000-0000-0000-000000000000", revision: 1, access_token: valido() });
    receber({ ...base, revision: 2, access_token: jwt(Math.floor(Date.now() / 1000) + 5) });
    await flush();
    expect(auth.setSession).not.toHaveBeenCalled();
    expect(parent.postMessage.mock.calls.at(-1)?.[0].type).toBe("error");
    receber({ ...base, revision: 2, access_token: valido() });
    await flush();
    expect(auth.setSession).not.toHaveBeenCalled();
  });

  it("revoke limpa só a sessão local", async () => {
    const { auth, receber, probe, nonce } = montar();
    probe();
    receber({ protocol: PROTOCOL, type: "revoke", nonce: nonce(), challenge: CHALLENGE, revision: 1 });
    await flush();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("Sair pede logout ao Hub em vez de encerrar a sessão", () => {
    const { parent, auth, receptor, probe, nonce } = montar();
    expect(receptor.pedirSaida()).toBe(false);
    probe();
    expect(receptor.pedirSaida()).toBe(true);
    expect(parent.postMessage.mock.calls[1]).toEqual([{ protocol: PROTOCOL, app: "ml", type: "logout", nonce: nonce(), challenge: CHALLENGE }, HUB]);
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

describe("limites do modo embutido", () => {
  it("origem do Hub só https exata", () => {
    expect(origemDoHub(HUB)).toBe(HUB);
    expect(origemDoHub(`${HUB}/`)).toBe(HUB);
    for (const v of [undefined, "", "*", "http://hub.exemplo.test", `${HUB}/x`, "https://u:p@hub.exemplo.test", "hub.exemplo.test"]) expect(origemDoHub(v)).toBeNull();
  });

  it("só embutido com hub_embed=1 dentro de iframe", () => {
    const self = { location: { search: "?hub_embed=1" } };
    self.parent = self;
    expect(modoEmbutido(self)).toBe(false);
    expect(modoEmbutido({ location: { search: "" }, parent: {} })).toBe(false);
    expect(modoEmbutido({ location: { search: "?hub_embed=1" }, parent: {} })).toBe(true);
  });

  it("fetch embutido nunca renova token nem faz logout no servidor", async () => {
    const real = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", real);
    try {
      const f = fetchEmbutido("https://projeto.supabase.co");
      expect((await f("https://projeto.supabase.co/auth/v1/token?grant_type=refresh_token", { method: "POST" })).status).toBe(401);
      expect((await f("https://projeto.supabase.co/auth/v1/logout?scope=local", { method: "POST" })).status).toBe(401);
      expect(real).not.toHaveBeenCalled();
      await f("https://projeto.supabase.co/auth/v1/user");
      await f("https://projeto.supabase.co/rest/v1/x");
      expect(real).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
