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
const VendasHoje = lazy(() => import('./pages/VendasHoje'))
const Tarefas = lazy(() => import('./pages/Tarefas'))
const Performance = lazy(() => import('./pages/Performance'))
const AnaliseAbc = lazy(() => import('./pages/AnaliseAbc'))
const Produtos = lazy(() => import('./pages/Produtos'))
const Rentabilidade = lazy(() => import('./pages/Rentabilidade'))
const Lucratividade = lazy(() => import('./pages/Lucratividade'))
const Impostos = lazy(() => import('./pages/Impostos'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const Previsoes = lazy(() => import('./pages/Previsoes'))
const Alertas = lazy(() => import('./pages/Alertas'))

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
                  <Route path="vendas" element={<VendasHoje />} />
                  <Route path="tarefas" element={<Tarefas />} />
                  <Route path="performance" element={<Performance />} />
                  <Route path="analise-abc" element={<AnaliseAbc />} />
                  <Route path="produtos" element={<Produtos />} />
                  <Route path="rentabilidade" element={<Rentabilidade />} />
                  <Route path="lucratividade" element={<Lucratividade />} />
                  <Route path="impostos" element={<Impostos />} />
                  <Route path="relatorios" element={<Relatorios />} />
                  <Route path="previsoes" element={<Previsoes />} />
                  <Route path="alertas" element={<Alertas />} />
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
