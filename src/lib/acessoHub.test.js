import { describe, expect, it } from "vitest";
import { verificarAcessoHub, SISTEMA_NO_HUB } from "./acessoHub";

const cliente = (resposta) => ({
  schema: (nome) => {
    expect(nome).toBe("hub");
    return {
      rpc: async (fn, args) => {
        expect(fn).toBe("pode_acessar");
        expect(args).toEqual({ p_sistema: SISTEMA_NO_HUB });
        if (resposta instanceof Error) throw resposta;
        return resposta;
      },
    };
  },
});

describe("verificarAcessoHub", () => {
  it("Hub responde true: liberado", async () => {
    expect(await verificarAcessoHub(cliente({ data: true, error: null }))).toBe("liberado");
  });
  it("Hub responde false: negado", async () => {
    expect(await verificarAcessoHub(cliente({ data: false, error: null }))).toBe("negado");
  });
  it("erro do Hub nunca libera", async () => {
    expect(await verificarAcessoHub(cliente({ data: null, error: { message: "x" } }))).toBe("erro");
    expect(await verificarAcessoHub(cliente(new Error("rede")))).toBe("erro");
    expect(await verificarAcessoHub(cliente({ data: "true", error: null }))).toBe("erro");
  });
});
