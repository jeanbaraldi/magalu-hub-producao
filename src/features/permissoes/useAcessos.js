// O que cada papel vê — lido do banco (`role_modules`), editável na tela.
//
// Antes isto era constante no código e mudar exigia deploy. A constante
// `MODULOS_BLOQUEADOS` continua existindo como PADRÃO: se a tabela estiver
// vazia (instalação nova) ou a leitura falhar, é ela que vale.

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabaseDelete, supabaseGet, supabasePost } from '../../api/supabaseClient'
import { MODULOS_BLOQUEADOS } from './permissoes.constants'

const TTL_MS = 5 * 60 * 1000
let _cache = { at: 0, mapa: null }
const _ouvintes = new Set()

function avisar(mapa) {
  _cache = { at: Date.now(), mapa }
  for (const fn of _ouvintes) fn(mapa)
}

/** linhas → { financeiro: Set, colaborador: Set } dos módulos OCULTOS. */
export function mapaDeOcultos(rows) {
  const mapa = { financeiro: new Set(), colaborador: new Set() }
  for (const r of rows ?? []) {
    if (r.oculto && mapa[r.papel]) mapa[r.papel].add(r.modulo)
  }
  return mapa
}

/** O padrão do código, usado quando o banco não responde ou está vazio. */
export function mapaPadrao() {
  return {
    financeiro: new Set(MODULOS_BLOQUEADOS.financeiro ?? []),
    colaborador: new Set(MODULOS_BLOQUEADOS.colaborador ?? []),
  }
}

export function useAcessos() {
  const [mapa, setMapa] = useState(() => _cache.mapa ?? mapaPadrao())
  const [carregando, setCarregando] = useState(!_cache.mapa)
  const [erro, setErro] = useState(null)
  const montado = useRef(true)

  useEffect(() => {
    montado.current = true
    const ouvinte = (m) => { if (montado.current) setMapa(m) }
    _ouvintes.add(ouvinte)
    return () => { montado.current = false; _ouvintes.delete(ouvinte) }
  }, [])

  const carregar = useCallback(async (force = false) => {
    if (!force && _cache.mapa && Date.now() - _cache.at < TTL_MS) {
      setMapa(_cache.mapa); setCarregando(false); return
    }
    try {
      const rows = await supabaseGet('role_modules', 'select=papel,modulo,oculto&limit=500')
      // Tabela vazia é instalação nova, não "ninguém esconde nada": cai no
      // padrão do código em vez de liberar tudo para todo mundo.
      avisar((rows ?? []).length ? mapaDeOcultos(rows) : mapaPadrao())
    } catch (e) {
      if (montado.current) { setErro(String(e?.message ?? e)); setMapa(mapaPadrao()) }
    } finally {
      if (montado.current) setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  /** Mostra ou esconde um módulo para um papel. Só admin passa no RLS. */
  const definir = useCallback(async (papel, modulo, oculto) => {
    const anterior = _cache.mapa ?? mapaPadrao()
    const otimista = {
      financeiro: new Set(anterior.financeiro),
      colaborador: new Set(anterior.colaborador),
    }
    if (oculto) otimista[papel]?.add(modulo)
    else otimista[papel]?.delete(modulo)
    avisar(otimista)

    try {
      if (oculto) {
        await supabasePost('role_modules?on_conflict=papel,modulo',
          { papel, modulo, oculto: true, updated_at: new Date().toISOString() },
          { prefer: 'resolution=merge-duplicates' })
      } else {
        // Ausência de linha é o estado "visível": apagar mantém a tabela
        // pequena e faz módulo novo nascer visível sem cadastro.
        await supabaseDelete('role_modules', `papel=eq.${papel}&modulo=eq.${encodeURIComponent(modulo)}`)
      }
      return { ok: true }
    } catch (e) {
      avisar(anterior) // reverte
      return { ok: false, error: String(e?.message ?? e) }
    }
  }, [])

  return { mapa, carregando, erro, definir, refetch: () => carregar(true) }
}
