// src/components/layout/Sidebar/sidebar.constants.js

export const SIDEBAR_STORAGE_KEY = 'gestor-ml-sidebar-mode'

/** Largura em px quando expandido (visual e reserva no AppLayout). */
export const WIDTH_EXPANDED = 224

/** Largura em px quando recolhido (visual e reserva no AppLayout). */
export const WIDTH_COLLAPSED = 76

/** Modos válidos persistidos no localStorage. */
export const SIDEBAR_MODES = /** @type {const} */ (['expanded', 'collapsed'])

/** Duração da transição de width (ms). */
export const WIDTH_TRANSITION_MS = 200

/** Duração da transição de opacity/translate dos labels e badges (ms). */
export const TEXT_TRANSITION_MS = 150
