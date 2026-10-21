import {
  LayoutDashboard, Activity, ClipboardList, ReceiptText, BarChart2, BarChart3,
  Package, Tag, Wallet, Coins, Receipt, TrendingUp, Bell, Settings,
} from 'lucide-react'

/**
 * Menu do Gestor Magalu. Mesmo formato e mesma ordem do Gestor ML; entram as telas que
 * a Magalu já sustenta com pedidos e catálogo. Campanhas, promoções, perguntas,
 * devoluções e recebíveis entram depois de conferir a API oficial.
 * Tela nova da Magalu entra aqui e em App.jsx.
 * @type {import('./sidebar.types').SidebarGroupConfig[]}
 */
export const NAV_GROUPS = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      { id: 'dashboard',   label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
      { id: 'vendas',      label: 'Vendas Hoje', href: '/vendas',      icon: Activity, liveDotFrom: 'isConnected', iconAnim: 'pulse' },
      { id: 'tarefas',     label: 'Tarefas',     href: '/tarefas',     icon: ClipboardList, iconAnim: 'rise' },
      { id: 'pedidos',     label: 'Pedidos',     href: '/pedidos',     icon: ReceiptText, iconAnim: 'rise' },
      { id: 'performance', label: 'Performance', href: '/performance', icon: BarChart2 },
      { id: 'analise-abc', label: 'Análise ABC', href: '/analise-abc', icon: BarChart3 },
    ],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    items: [
      { id: 'produtos', label: 'Produtos', href: '/produtos', icon: Package },
      { id: 'anuncios', label: 'Anúncios', href: '/anuncios', icon: Tag },
    ],
  },
  {
    id: 'gestao',
    label: 'Gestão',
    items: [
      { id: 'rentabilidade', label: 'Rentabilidade', href: '/rentabilidade', icon: Wallet },
      { id: 'lucratividade', label: 'Lucratividade', href: '/lucratividade', icon: Coins },
      { id: 'impostos',      label: 'Impostos',      href: '/impostos',      icon: Receipt },
      { id: 'relatorios',    label: 'Relatórios',    href: '/relatorios',    icon: BarChart3 },
      { id: 'previsoes',     label: 'Previsões',     href: '/previsoes',     icon: TrendingUp, iconAnim: 'rise' },
    ],
  },
  {
    id: 'operacao',
    label: 'Operação',
    items: [
      { id: 'alertas', label: 'Alertas', href: '/alertas', icon: Bell, iconAnim: 'ring' },
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
