// Suíte (projeto único): as credenciais do app da Magalu são cadastradas no Hub
// (aba Conexões → cofre). Ordem: Edge Function Secret > Hub > magalu.app_config.
// hub.ler_credencial só responde a service_role; o navegador nunca vê o valor.
// Falha do Hub não derruba a function: fica o que havia.
import { createClient } from "npm:@supabase/supabase-js@2";

const MAPA: Record<string, [string, string]> = {
  MAGALU_CLIENT_ID: ["magalu", "client_id"],
  MAGALU_CLIENT_SECRET: ["magalu", "client_secret"],
};

export const CHAVES_APP = Object.keys(MAPA);

export async function credenciaisDoHub(chaves: string[] = CHAVES_APP): Promise<Record<string, string>> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return {};
  const hub = createClient(url, key, { db: { schema: "hub" }, auth: { persistSession: false } });
  const saida: Record<string, string> = {};
  for (const nome of chaves) {
    const alvo = MAPA[nome];
    if (!alvo) continue;
    try {
      const { data, error } = await hub.rpc("ler_credencial", { p_provedor: alvo[0], p_chave: alvo[1] });
      if (!error && typeof data === "string" && data.trim()) saida[nome] = data.trim();
    } catch { /* Hub indisponível: segue com a tabela/Secret */ }
  }
  return saida;
}
