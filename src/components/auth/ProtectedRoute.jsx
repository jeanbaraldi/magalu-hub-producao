import { Navigate, Outlet } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

/**
 * Protege todas as rotas filhas.
 * - Enquanto carrega a sessão: mostra spinner (evita flash de /login)
 * - Sem sessão: redireciona para /login
 * - Com sessão: renderiza as rotas normalmente
 */
export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader size={24} className="text-slate-400 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
