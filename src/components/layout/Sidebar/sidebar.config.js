import { LayoutDashboard, ReceiptText, Tag, Settings } from 'lucide-react'

/**
 * Menu do Gestor Magalu. Mesmo formato do Gestor ML; entra só o que a v1 entrega.
 * Tela nova da Magalu entra aqui e em App.jsx.
 * @type {import('./sidebar.types').SidebarGroupConfig[]}
 */
export const NAV_GROUPS = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { id: 'pedidos',   label: 'Pedidos',   href: '/pedidos',   icon: ReceiptText, iconAnim: 'rise' },
    ],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    items: [
      { id: 'anuncios', label: 'Anúncios', href: '/anuncios', icon: Tag },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    items: [
      { id: 'configuracoes', label: 'Configurações', href: '/configuracoes', icon: Settings, statusDotFrom: 'contaDesconectadaDot', iconAnim: 'spin' },
    ],
  },
]
