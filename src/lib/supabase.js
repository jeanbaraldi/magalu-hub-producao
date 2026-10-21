import { createClient } from '@supabase/supabase-js'
import { EMBUTIDO, fetchEmbutido, ligarReceptorHub } from './embedHub'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sem isto, env ausente vira PÁGINA EM BRANCO: o createClient lança
// "supabaseUrl is required" durante o import, antes do React montar.
// E a variável é embutida no BUNDLE em build — preencher depois exige
// um NOVO deploy (hand-off 2026-08-25, defeito 7).
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const faltando = [
    !SUPABASE_URL && 'VITE_SUPABASE_URL',
    !SUPABASE_ANON_KEY && 'VITE_SUPABASE_ANON_KEY',
  ].filter(Boolean).join(' e ')
  throw new Error(
    `Configuração ausente: ${faltando}. Defina no painel do host (Environment Variables) ` +
    `ou no .env.local e faça um NOVO deploy — o Vite embute esses valores no build.`,
  )
}

// Suíte (projeto único): as tabelas do Gestor Magalu ficam no schema "magalu".
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'magalu' },
  // Aberto numa aba do Hub (?hub_embed=1 dentro de iframe): sessão só em memória,
  // entregue e renovada pelo Hub. Fora do Hub, o login normal de sempre.
  auth: EMBUTIDO ? {
    storageKey: 'magalu-suite-embed',
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  } : {
    // Mesmo usuário do Hub; sessão guardada separada por ferramenta.
    storageKey: 'magalu-suite-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // processa callback PKCE do Google automaticamente
  },
  ...(EMBUTIDO ? { global: { fetch: fetchEmbutido(SUPABASE_URL) } } : {}),
})
ligarReceptorHub(supabase.auth)
