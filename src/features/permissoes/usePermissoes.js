// Papel da sessão atual. ÚNICO ponto de fetch das permissões.
//
// O papel vem do Hub, via magalu.papel_atual(): admin do Hub = admin; "ver valores"
// na Magalu = financeiro; demais com acesso à Magalu = colaborador. Quem cria usuário e
// libera acesso é o Hub. A trava real são as políticas do banco (acesso pelo
// Hub em toda tabela da Magalu); esconder menu aqui é apresentação.

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabaseRpc } from '../../api/supabaseClient'
import { PAPEIS } from './permissoes.constants'
import { podeVerFinanceiro } from './permissoes.mapper'
import { useAcessos } from './useAcessos'

export function usePermissoes() {
  const { user } = useAuth()
  // O que cada papel vê é DADO, editável na tela de Acessos — não constante.
  const { mapa: ocultosPorPapel, carregando: acessosCarregando } = useAcessos()
  const [papel, setPapel] = useState(null)
  const [carregandoPapel, setCarregandoPapel] = useState(true)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    let vivo = true
    if (!user?.id) { setPapel(null); setCarregandoPapel(false); return () => { vivo = false } }
    setCarregandoPapel(true)
    supabaseRpc('papel_atual')
      .then((r) => { if (vivo) { setPapel(PAPEIS[r] ? r : null); setFalhou(false) } })
      // Falhar ao ler não define papel nenhum — e precisa ser sinalizado: sem
      // isso, um blip de rede deixaria o próprio admin com o menu vazio.
      .catch(() => { if (vivo) { setPapel(null); setFalhou(true) } })
      .finally(() => { if (vivo) setCarregandoPapel(false) })
    return () => { vivo = false }
  }, [user?.id])

  const carregando = carregandoPapel || acessosCarregando
  // Não conseguir LER quem é quem é diferente de saber que a pessoa não pode.
  const indefinido = falhou

  return {
    papel,
    carregando,
    /**
     * A leitura falhou: quem consome deve degradar ABERTO (mostrar tudo).
     * O front é apresentação — a trava é o RLS. Fechar o menu por causa de um
     * erro de rede tiraria o dono do próprio sistema sem protegar nada.
     */
    indefinido,
    // Enquanto carrega, `papel` é null e nada deve ser decidido: quem consome
    // precisa esperar, senão a sidebar pisca vazia para o próprio admin.
    ehAdmin: papel === 'admin',
    podeFinanceiro: podeVerFinanceiro(papel),
    /**
     * Admin abre tudo. Papel desconhecido não abre nada — "não sei quem é" não
     * é colaborador. Para os demais, vale o que está marcado na tela de
     * Acessos; ausência de linha significa visível.
     */
    podeModulo: (id) => {
      if (papel === 'admin') return true
      if (!papel) return false
      return !(ocultosPorPapel?.[papel]?.has(id) ?? false)
    },
  }
}
