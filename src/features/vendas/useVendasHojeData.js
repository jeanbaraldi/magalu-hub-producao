import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { dispararSync, lerPedidos } from '../magalu/magaluDb'
import { inicioDoPeriodo } from '../magalu/vendas'
import { erroDoSync, mapVendasHoje } from './vendas.mapper'
import { REALTIME_DEBOUNCE_MS, REFRESH_MS, SYNC_DIAS, SYNC_MS } from './vendas.constants'

// Última vez que ESTA aba puxou pedidos da Magalu, por loja. Fica fora do componente
// para sair e voltar da tela não disparar outro sync em seguida.
const ultimoSyncPorConta = new Map()

/**
 * Único ponto de fetch de Vendas Hoje "ao vivo":
 * - puxa pedidos novos da Magalu (magalu-sync, só hoje) ao abrir e a cada 2 min;
 * - assina o Realtime de magalu.orders e relê assim que o sync grava;
 * - relê o espelho a cada 30 s como rede de segurança.
 * Tudo é limpo ao desmontar ou trocar de loja.
 */
export function useVendasHojeData() {
  const { contaId, isConnected, supabaseUrl, supabaseAnonKey } = useApp()
  const [estado, setEstado] = useState({ conta: null, pedidos: [], agora: null, error: null })
  const [loading, setLoading] = useState(false)
  const [sync, setSync] = useState({ conta: null, rodando: false, em: null, erro: null })
  const pedido = useRef(0)
  const syncRodando = useRef(false)

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    const agora = new Date()
    setLoading(true)
    try {
      const linhas = await lerPedidos(contaId, inicioDoPeriodo(2, agora))
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, pedidos: linhas, agora, error: null })
    } catch (e) {
      if (meu !== pedido.current) return
      // Erro numa atualização automática não apaga o que já estava na tela da MESMA loja.
      setEstado((ant) => (ant.conta === contaId
        ? { ...ant, error: e.message }
        : { conta: contaId, pedidos: [], agora, error: e.message }))
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId])

  const sincronizar = useCallback(async ({ forcar = false } = {}) => {
    if (!contaId || syncRodando.current) return
    const ultimo = ultimoSyncPorConta.get(contaId) ?? 0
    if (!forcar && Date.now() - ultimo < SYNC_MS) return
    syncRodando.current = true
    ultimoSyncPorConta.set(contaId, Date.now())
    const conta = contaId
    setSync((s) => ({ ...(s.conta === conta ? s : { em: null, erro: null }), conta, rodando: true }))
    try {
      const corpo = await dispararSync({ supabaseUrl, anonKey: supabaseAnonKey, accountId: conta, kind: 'orders', days: SYNC_DIAS })
      setSync({ conta, rodando: false, em: new Date(), erro: erroDoSync(corpo, conta) })
    } catch (e) {
      setSync((s) => ({ conta, rodando: false, em: s.conta === conta ? s.em : null, erro: e.message }))
    } finally {
      syncRodando.current = false
    }
    // Rede de segurança caso o Realtime não esteja ligado nesta instalação.
    carregar()
  }, [contaId, supabaseUrl, supabaseAnonKey, carregar])

  // Releitura do espelho + sync periódico com a Magalu.
  useEffect(() => {
    carregar()
    if (!contaId) return undefined
    sincronizar()
    const leitura = setInterval(carregar, REFRESH_MS)
    const puxar = setInterval(() => sincronizar(), SYNC_MS)
    return () => { clearInterval(leitura); clearInterval(puxar) }
  }, [carregar, sincronizar, contaId])

  // Realtime: pedido gravado pelo sync (da tela ou do cron) repinta em segundos.
  useEffect(() => {
    if (!contaId) return undefined
    let timer = null
    const canal = supabase
      .channel(`magalu-orders-${contaId}`)
      .on('postgres_changes', { event: '*', schema: 'magalu', table: 'orders', filter: `account_id=eq.${contaId}` }, () => {
        clearTimeout(timer)
        timer = setTimeout(carregar, REALTIME_DEBOUNCE_MS)
      })
      .subscribe()
    return () => { clearTimeout(timer); supabase.removeChannel(canal) }
  }, [contaId, carregar])

  // Nunca expõe pedidos de outra loja durante a troca.
  const atual = estado.conta === contaId
  const vm = useMemo(
    () => mapVendasHoje(atual ? estado.pedidos : [], atual && estado.agora ? estado.agora : new Date()),
    [atual, estado]
  )
  const syncAtual = sync.conta === contaId

  return {
    vm,
    atualizadoEm: atual ? estado.agora : null,
    loading: loading || (!!contaId && !atual),
    error: atual ? estado.error : null,
    sincronizando: syncAtual && sync.rodando,
    sincronizadoEm: syncAtual ? sync.em : null,
    erroSync: syncAtual ? sync.erro : null,
    refetch: () => sincronizar({ forcar: true }),
    isConnected,
  }
}
