// src/components/layout/Sidebar/Sidebar.jsx
import { useApp } from '../../../context/AppContext'
import { useAuth } from '../../../context/AuthContext'
import { cn } from '../../../lib/utils'
import { NAV_GROUPS } from './sidebar.config'
import { usePermissoes } from '../../../features/permissoes/usePermissoes'
import { filtrarNavegacao } from '../../../features/permissoes/permissoes.mapper'
import { WIDTH_COLLAPSED, WIDTH_EXPANDED, WIDTH_TRANSITION_MS } from './sidebar.constants'
import SidebarHeader from './SidebarHeader'
import SidebarAccountSwitcher from './SidebarAccountSwitcher'
import SidebarGroup from './SidebarGroup'
import SidebarItem from './SidebarItem'
import SidebarUserFooter from './SidebarUserFooter'

/**
 * Sidebar principal — desktop (3 estados via useSidebarState) + drawer mobile.
 *
 * @param {{
 *   sidebarOpen: boolean,
 *   setSidebarOpen: (open: boolean) => void,
 *   mode: import('./sidebar.types').SidebarMode,
 *   isExpanded: boolean,
 *   togglePin: () => void,
 *   setHovering: (v: boolean) => void,
 * }} props
 */
export default function Sidebar({ sidebarOpen, setSidebarOpen, mode, isExpanded, togglePin, setHovering }) {
  const { isConnected, checkingStatus } = useApp()
  const { user, signOut } = useAuth()

  const dynamicData = {
    isConnected,
    contaDesconectadaDot: !isConnected && !checkingStatus,
  }

  const { carregando: permissoesCarregando, indefinido, podeModulo } = usePermissoes()
  // Enquanto o papel não chegou — ou se a leitura falhou — mostra a navegação
  // inteira. Piscar (ou travar) um menu vazio para o próprio admin por causa
  // de um blip de rede seria pior, e não protegeria nada: a trava é o RLS.
  const gruposVisiveis = permissoesCarregando || indefinido
    ? NAV_GROUPS
    : filtrarNavegacao(NAV_GROUPS, podeModulo)

  const closeSidebar = () => setSidebarOpen(false)

  const onMouseEnter = () => { if (mode === 'collapsed') setHovering(true) }
  const onMouseLeave = () => { if (mode === 'collapsed') setHovering(false) }

  const content = (
    <>
      <SidebarHeader
        isExpanded={isExpanded}
        mode={mode}
        onTogglePin={togglePin}
        onCloseMobile={sidebarOpen ? closeSidebar : undefined}
      />
      <SidebarAccountSwitcher isExpanded={isExpanded} onSelect={closeSidebar} />

      <div className={cn('flex-1 overflow-y-auto', isExpanded ? 'px-3 py-4' : 'px-0 py-2 scrollbar-none')}>
        {gruposVisiveis.map((group, idx) => (
          <SidebarGroup key={group.id} label={group.label} isExpanded={isExpanded} isFirst={idx === 0}>
            {group.items.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                dynamicData={dynamicData}
                isExpanded={isExpanded}
                onNavigate={closeSidebar}
              />
            ))}
          </SidebarGroup>
        ))}
      </div>

      <SidebarUserFooter user={user} signOut={signOut} isExpanded={isExpanded} />
    </>
  )

  return (
    <>
      {/* Desktop sidebar — fixed + width segue isExpanded */}
      <aside
        role="navigation"
        aria-label="Navegação principal"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="hidden lg:flex lg:flex-col bg-sidebar-bg h-screen fixed left-0 top-0 z-30 border-r border-white/8"
        style={{
          width: isExpanded ? WIDTH_EXPANDED : WIDTH_COLLAPSED,
          transition: `width ${WIDTH_TRANSITION_MS}ms ease-out`,
        }}
      >
        {content}
      </aside>

      {/* Mobile drawer (preserva comportamento atual) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={closeSidebar} aria-hidden="true" />
          <aside
            role="navigation"
            aria-label="Navegação principal"
            className="fixed inset-y-0 left-0 w-64 bg-sidebar-bg flex flex-col z-50 animate-slide-in-left"
          >
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
