import { useCallback, useState } from 'react'
import { SIDEBAR_STORAGE_KEY, SIDEBAR_MODES } from '../components/layout/Sidebar/sidebar.constants'

function readStored() {
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return SIDEBAR_MODES.includes(raw) ? raw : null
  } catch {
    return null
  }
}

function writeStored(value) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, value)
  } catch {
    /* quota / private mode */
  }
}

/**
 * Estado da sidebar — controla mode persistido + hover transitório.
 * isExpanded é derivado: 'expanded' OU ('collapsed' && isHovering).
 *
 * @returns {{
 *   mode: 'expanded' | 'collapsed',
 *   isHovering: boolean,
 *   isExpanded: boolean,
 *   togglePin: () => void,
 *   setHovering: (v: boolean) => void
 * }}
 */
export function useSidebarState() {
  const [mode, setMode] = useState(() => readStored() ?? 'expanded')
  const [isHovering, setHovering] = useState(false)

  const isExpanded = mode === 'expanded' || (mode === 'collapsed' && isHovering)

  const togglePin = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'expanded' ? 'collapsed' : 'expanded'
      writeStored(next)
      return next
    })
    setHovering(false)
  }, [])

  return { mode, isHovering, isExpanded, togglePin, setHovering }
}
