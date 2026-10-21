// src/components/layout/Sidebar/SidebarColumn.jsx
import { WIDTH_COLLAPSED, WIDTH_EXPANDED, WIDTH_TRANSITION_MS } from './sidebar.constants'

/**
 * Reserva de coluna fixa no AppLayout — segue MODE (não isExpanded), pra que
 * o hover-expand seja overlay verdadeiro sem layout shift.
 *
 * @param {{ mode: import('./sidebar.types').SidebarMode }} props
 */
export default function SidebarColumn({ mode }) {
  const width = mode === 'expanded' ? WIDTH_EXPANDED : WIDTH_COLLAPSED
  return (
    <div
      aria-hidden="true"
      className="hidden lg:block flex-shrink-0 print:!hidden"
      style={{ width, transition: `width ${WIDTH_TRANSITION_MS}ms ease-out` }}
    />
  )
}
