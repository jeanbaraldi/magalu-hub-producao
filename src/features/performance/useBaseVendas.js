import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { lerPedidos, lerSkus } from '../magalu/magaluDb'
import { inicioDoPeriodo } from '../magalu/vendas'
import { useGestaoConfig } from '../magalu/useGestaoConfig'

/**
 * Leitura compartilhada pelas telas de Performance, Análise ABC, Lucratividade e
 * Rentabilidade: pedidos desde `diasLeitura` atrás + catálogo + custos/configuração.
 * Cada tela tem o seu hook `use<X>Data`, que é o único que chama este aqui.
 *
 * Guarda a loja de origem: durante a troca de loja não expõe nada da anterior, e
 * resposta atrasada é descartada pelo contador.
 */
export function useBaseVendas(diasLeitura) {
  const { contaId, isConnected } = useApp()
  const gestao = useGestaoConfig()
  const [estado, setEstado] = useState({ conta: null, dias: null, pedidos: [], skus: [], agora: null, error: null })
  const [loading, setLoading] = useState(false)
  const pedido = useRef(0)

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    setLoading(true)
    const agora = new Date()
    try {
      const [pedidos, skus] = await Promise.all([
        lerPedidos(contaId, inicioDoPeriodo(diasLeitura, agora)),
        lerSkus(contaId),
      ])
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, dias: diasLeitura, pedidos, skus, agora: agora.toISOString(), error: null })
    } catch (e) {
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, dias: diasLeitura, pedidos: [], skus: [], agora: agora.toISOString(), error: e.message })
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId, diasLeitura])

  useEffect(() => { carregar() }, [carregar])

  const atual = estado.conta === contaId && estado.dias === diasLeitura
  const refetch = useCallback(() => { carregar(); gestao.refetch() }, [carregar, gestao.refetch])
  return {
    pedidos: atual ? estado.pedidos : [],
    skus: atual ? estado.skus : [],
    agora: atual ? estado.agora : null,
    pronto: atual && !loading,
    custos: gestao.custos,
    cfg: gestao.cfg,
    podeVerValores: gestao.podeVerValores,
    loading: loading || (!!contaId && !atual) || gestao.loading,
    error: (atual ? estado.error : null) ?? gestao.error,
    refetch, isConnected,
  }
}
