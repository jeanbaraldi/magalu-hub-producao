// Bloqueia a rota quando o papel não alcança o módulo.
//
// ⚠️ Esconder o item do menu não protege nada: quem digita a URL entra do
// mesmo jeito. Esta guarda deriva o módulo do PRIMEIRO segmento do caminho, e
// não de uma lista — assim rota nova nasce coberta em vez de esquecida.
//
// ⚠️ E isto ainda é o navegador. A trava real é o RLS, que nesta fase NÃO foi
// aplicado: um colaborador que chame a API direto continua recebendo os dados.
import { Outlet, useLocation, useOutletContext, Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { usePermissoes } from '../../features/permissoes/usePermissoes'
import { PAPEIS } from '../../features/permissoes/permissoes.constants'
import EmptyState from '../ui/EmptyState'

export default function GuardaDeModulo() {
  const { pathname } = useLocation()
  // Repassa o contexto do AppLayout (ex.: `updates` da Central de atualizações):
  // um Outlet intermediário sem `context` o corta, e a página quebra em branco.
  const contexto = useOutletContext()
  const { papel, carregando, indefinido, podeModulo } = usePermissoes()

  // Enquanto o papel não chegou — ou se a leitura falhou — deixa passar:
  // barrar aí mostraria "sem acesso" ao próprio admin a cada abertura, sem
  // proteger nada, já que a trava real é o RLS.
  if (carregando || indefinido) return <Outlet context={contexto} />

  const modulo = pathname.split('/').filter(Boolean)[0] ?? 'dashboard'
  if (podeModulo(modulo)) return <Outlet context={contexto} />

  return (
    <div className="p-6 sm:p-10">
      <EmptyState
        icon={Lock}
        title="Você não tem acesso a esta área"
        description={
          papel
            ? `Seu acesso é de ${PAPEIS[papel]?.label ?? papel}. Peça a um admin se precisar entrar aqui.`
            : 'Seu usuário ainda não está vinculado a um membro da equipe. Peça a um admin para cadastrar.'
        }
        action={<Link to="/dashboard" className="text-sm font-bold text-slate-900 underline">Voltar ao painel</Link>}
      />
    </div>
  )
}
