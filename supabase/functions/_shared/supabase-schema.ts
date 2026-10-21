// [suíte] Todo cliente Supabase das functions nasce no schema "magalu".
// Mesma assinatura do createClient original (tipos preservados); db.schema explícito
// do chamador continua valendo.
export * from "npm:@supabase/supabase-js@2";
import { createClient as criar } from "npm:@supabase/supabase-js@2";

export const createClient: typeof criar = ((url: string, key: string, opcoes?: Record<string, unknown>) =>
  criar(url, key, {
    ...(opcoes ?? {}),
    db: { schema: "magalu", ...((opcoes?.db as Record<string, unknown>) ?? {}) },
  } as never)) as typeof criar;
