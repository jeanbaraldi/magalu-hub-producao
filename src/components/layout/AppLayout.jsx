// src/components/layout/AppLayout.jsx
import { useState, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, ShoppingCart } from 'lucide-react'
import Sidebar, { SidebarColumn } from './Sidebar'
import { useSidebarState } from '../../hooks/useSidebarState'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { mode, isExpanded, togglePin, setHovering } = useSidebarState()

  return (
    <div className="flex min-h-screen bg-surface-page">
      {/* Skip link para navegação por teclado */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#0086FF] focus:text-white focus:rounded-lg focus:font-bold focus:text-sm focus:shadow-lg"
      >
        Ir para conteúdo principal
      </a>

      {/* Mobile top bar */}
      <div className="fixed top-0 inset-x-0 h-14 bg-slate-900 border-b border-slate-800 z-40 lg:hidden flex items-center px-4 gap-3 print:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-mg-blue rounded-md flex items-center justify-center flex-shrink-0">
            <ShoppingCart size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <p className="text-white font-bold text-sm">Gestor Magalu</p>
        </div>
      </div>

      {/* Reserva fixa da coluna esquerda (segue MODE — desktop) */}
      <SidebarColumn mode={mode} />

      {/* Sidebar — fixed por trás de modais, mas acima do conteúdo */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mode={mode}
        isExpanded={isExpanded}
        togglePin={togglePin}
        setHovering={setHovering}
      />

      {/* Main content */}
      <main id="main-content" className="flex-1 min-w-0 overflow-auto pt-14 lg:pt-0">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#0086FF] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
