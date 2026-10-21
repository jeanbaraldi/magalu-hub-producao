// src/components/layout/Sidebar/sidebar.types.js

/**
 * @typedef {'expanded' | 'collapsed'} SidebarMode
 * @typedef {'default' | 'warning' | 'danger' | 'success'} SidebarBadgeTone
 * @typedef {'ring' | 'tremor' | 'spin' | 'wiggle' | 'rise' | 'pulse' | 'nod'} SidebarIconAnim
 */

/**
 * @typedef {Object} SidebarItemConfig
 * @property {string} id
 * @property {string} label
 * @property {string} href
 * @property {React.ComponentType<{ size?: number, 'aria-hidden'?: boolean, strokeWidth?: number, className?: string }>} icon
 * @property {string[]} [match]
 * @property {string} [badgeFrom]
 * @property {SidebarBadgeTone} [badgeTone]
 * @property {string} [liveDotFrom]
 * @property {string} [statusDotFrom]
 * @property {SidebarIconAnim} [iconAnim] — animação semântica do ícone no hover (expandido); ausente = spring default
 */

/**
 * @typedef {Object} SidebarGroupConfig
 * @property {string} id
 * @property {string} label
 * @property {SidebarItemConfig[]} items
 */

/**
 * Dados dinâmicos resolvidos pelo Sidebar.jsx e passados aos itens.
 * Chaves bate com `badgeFrom`/`liveDotFrom`/`statusDotFrom` em sidebar.config.js.
 * @typedef {Object} SidebarDynamicData
 * @property {number} unlinkedCount
 * @property {number} expiringPromosCount
 * @property {number} unansweredQuestionsCount
 * @property {boolean} isConnected
 * @property {boolean} contaDesconectadaDot
 */

export {}
