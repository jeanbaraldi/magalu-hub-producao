import { lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import GuardaDeModulo from './components/auth/GuardaDeModulo'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Pedidos = lazy(() => import('./pages/Pedidos'))
const Anuncios = lazy(() => import('./pages/Anuncios'))
const Settings = lazy(() => import('./pages/Settings'))

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <Routes>
            {/* Rota pública — acessível sem autenticação */}
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                {/* Tela nova entra aqui E em sidebar.config.js */}
                <Route element={<GuardaDeModulo />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="pedidos" element={<Pedidos />} />
                  <Route path="anuncios" element={<Anuncios />} />
                  <Route path="configuracoes" element={<Settings />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  )
}
