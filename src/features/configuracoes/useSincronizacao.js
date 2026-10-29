import { useCallback, useState } from 'react'
import { dispararSync } from '../magalu/magaluDb'
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
      const corpo = await dispararSync({ supabaseUrl, anonKey: supabaseAnonKey, accountId, kind, days: 30 })
      setResultado({ accountId, ok: true, corpo })
    } catch (e) {
      setResultado({ accountId, ok: false, erro: e.message })
    } finally {
      setRodando(null)
    }
  }, [supabaseUrl, supabaseAnonKey])

  return { sincronizar, rodando, resultado }
}
