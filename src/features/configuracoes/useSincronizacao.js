import { useCallback, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useApp } from '../../context/AppContext'

/** Único ponto de fetch da tela de Configurações: dispara o magalu-sync da loja. */
export function useSincronizacao() {
  const { supabaseUrl, supabaseAnonKey } = useApp()
  const [rodando, setRodando] = useState(null) // account_id em sincronização
  const [resultado, setResultado] = useState(null)

  const sincronizar = useCallback(async (accountId, kind = 'all') => {
    setRodando(accountId)
    setResultado(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${supabaseUrl}/functions/v1/magalu-sync`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account_id: accountId, kind, days: 30 }),
      })
      const corpo = await res.json().catch(() => null)
      if (!res.ok) throw new Error(corpo?.message ?? corpo?.error ?? `HTTP ${res.status}`)
      setResultado({ accountId, ok: true, corpo })
    } catch (e) {
      setResultado({ accountId, ok: false, erro: e.message })
    } finally {
      setRodando(null)
    }
  }, [supabaseUrl, supabaseAnonKey])

  return { sincronizar, rodando, resultado }
}
