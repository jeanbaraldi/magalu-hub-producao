import { supabase } from '../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Constrói headers por request usando o JWT da sessão ativa.
 * Se não há sessão (não deve acontecer em rotas protegidas), cai no anon key.
 */
async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? SUPABASE_ANON_KEY
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    // Suíte (projeto único): as tabelas do Gestor Magalu ficam no schema "magalu".
    'Accept-Profile': 'magalu',
    'Content-Profile': 'magalu',
  }
}

async function handleResponse(res) {
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || JSON.stringify(data)
    throw new Error(`Supabase error ${res.status}: ${msg}`)
  }
  return data
}

/**
 * GET /rest/v1/{table}?{query}
 * query: string like "id=eq.uuid&select=*"
 */
export async function supabaseGet(table, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`
  const res = await fetch(url, { headers: await getHeaders() })
  return handleResponse(res)
}

/** Leitura completa com ordem estável: evita margens calculadas sobre vínculos truncados. */
export async function supabaseGetAll(table, query = '', { desempate = ['id'] } = {}) {
  const result = []
  const params = new URLSearchParams(query)
  // Paginar por offset exige ordem TOTAL. O desempate padrão é `id`; tabela sem
  // essa coluna (PK composta ou outro nome) informa as suas — senão o PostgREST
  // devolve 400 "column <tabela>.id does not exist".
  const ordem = (params.get('order') ?? '').split(',').filter(Boolean)
  const faltam = desempate.filter((c) => !ordem.some((o) => o.split('.')[0] === c))
  params.set('order', [...ordem, ...faltam.map((c) => `${c}.asc`)].join(','))
  for (let offset = 0; offset < 100000; offset += 1000) {
    params.set('limit', '1000')
    params.set('offset', String(offset))
    const page = await supabaseGet(table, params.toString())
    if (!Array.isArray(page)) throw new Error(`Resposta inválida ao consultar ${table}`)
    result.push(...page)
    if (page.length < 1000) return result
  }
  throw new Error(`Consulta de ${table} excede o limite. Dados incompletos.`)
}

/**
 * POST /rest/v1/{table}
 */
export async function supabasePost(table, body, { prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...(await getHeaders()), ...(prefer ? { Prefer: prefer } : {}) },
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

/**
 * POST /rest/v1/rpc/{fn} — função do schema "magalu".
 */
export async function supabaseRpc(fn, args = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(args),
  })
  return handleResponse(res)
}

/**
 * PATCH /rest/v1/{table}?{query}
 */
export async function supabasePatch(table, query, body) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: await getHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

/**
 * DELETE /rest/v1/{table}?{query}
 */
export async function supabaseDelete(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: await getHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase delete error ${res.status}: ${text}`)
  }
  return true
}

/**
 * Call a Supabase Edge Function
 */
export async function callFunction(fnName, body = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? SUPABASE_ANON_KEY
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}
