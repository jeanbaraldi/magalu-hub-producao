import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { lerTudo } from '../magalu/magaluDb'
import { COLUNAS } from './tarefas.constants'
import { hojeBrt, mapTarefa, ordenarTarefas, kpisTarefas, responsaveis } from './tarefas.mapper'

/**
 * Único ponto de fetch de Tarefas (magalu.tasks da loja ativa).
 * Gravação otimista: a tela muda na hora e volta ao estado anterior se o banco recusar.
 */
export function useTarefasData() {
  const { contaId, isConnected } = useApp()
  const [estado, setEstado] = useState({ conta: null, rows: [], error: null })
  const [loading, setLoading] = useState(false)
  const pedido = useRef(0)
  // Leitura síncrona do estado atual para guardar o "antes" da gravação otimista.
  const atual = useRef(estado)
  atual.current = estado

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    setLoading(true)
    try {
      const linhas = await lerTudo('tasks', COLUNAS,
        (q) => q.eq('account_id', contaId).order('created_at', { ascending: false }).order('id', { ascending: true }))
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, rows: linhas, error: null })
    } catch (e) {
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, rows: [], error: e.message })
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId])

  useEffect(() => { carregar() }, [carregar])

  /** Aplica `fn` só se o estado ainda for da mesma loja. */
  const mexer = useCallback((conta, fn) => {
    setEstado((s) => (s.conta === conta ? { ...s, rows: fn(s.rows) } : s))
  }, [])

  const criar = useCallback(async (campos) => {
    const conta = contaId
    if (!conta) return
    const temp = { id: `tmp-${Date.now()}`, account_id: conta, created_at: new Date().toISOString(), completed_at: campos.status === 'concluida' ? new Date().toISOString() : null, ...campos }
    mexer(conta, (rows) => [temp, ...rows])
    const { data, error } = await supabase.from('tasks').insert({ ...campos, account_id: conta }).select(COLUNAS).single()
    if (error) {
      mexer(conta, (rows) => rows.filter((r) => r.id !== temp.id))
      throw new Error(error.message)
    }
    mexer(conta, (rows) => rows.map((r) => (r.id === temp.id ? data : r)))
  }, [contaId, mexer])

  const atualizar = useCallback(async (id, campos) => {
    const conta = contaId
    if (!conta) return
    const anterior = atual.current.conta === conta ? atual.current.rows.find((r) => r.id === id) ?? null : null
    mexer(conta, (rows) => rows.map((r) => {
      if (r.id !== id) return r
      const completed_at = campos.status === undefined ? r.completed_at
        : campos.status === 'concluida' ? (r.status === 'concluida' ? r.completed_at : new Date().toISOString()) : null
      return { ...r, ...campos, completed_at }
    }))
    const { data, error } = await supabase.from('tasks').update(campos).eq('id', id).eq('account_id', conta).select(COLUNAS).single()
    if (error) {
      if (anterior) mexer(conta, (rows) => rows.map((r) => (r.id === id ? anterior : r)))
      throw new Error(error.message)
    }
    mexer(conta, (rows) => rows.map((r) => (r.id === id ? data : r)))
  }, [contaId, mexer])

  const excluir = useCallback(async (id) => {
    const conta = contaId
    if (!conta) return
    const removida = atual.current.conta === conta ? atual.current.rows.find((r) => r.id === id) ?? null : null
    mexer(conta, (rows) => rows.filter((r) => r.id !== id))
    const { error } = await supabase.from('tasks').delete().eq('id', id).eq('account_id', conta)
    if (error) {
      if (removida) mexer(conta, (rows) => (rows.some((r) => r.id === id) ? rows : [removida, ...rows]))
      throw new Error(error.message)
    }
  }, [contaId, mexer])

  const daConta = estado.conta === contaId
  const hoje = hojeBrt()
  const rows = useMemo(() => (daConta ? ordenarTarefas(estado.rows.map((t) => mapTarefa(t, hoje))) : []), [daConta, estado.rows, hoje])
  const kpis = useMemo(() => kpisTarefas(rows), [rows])
  const pessoas = useMemo(() => responsaveis(rows), [rows])

  return {
    rows, kpis, pessoas,
    loading: loading || (!!contaId && !daConta),
    error: daConta ? estado.error : null,
    criar, atualizar, excluir, refetch: carregar, isConnected,
  }
}
