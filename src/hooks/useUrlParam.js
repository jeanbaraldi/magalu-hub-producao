import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Reads/writes a single state value from/to a URL query param.
 *
 * - Reads via `useSearchParams`; if absent or invalid (when `allowed` provided),
 *   falls back to `defaultValue`.
 * - On write: omits the param when value === default (keeps URLs clean) and
 *   uses `{ replace: true }` to avoid history pollution per change.
 * - Optional `parse` function coerces the URL string to a typed value
 *   (e.g. `Number`); default is identity (string).
 *
 * @param {string} key — query param name (e.g. 'days', 'tab')
 * @param {*} defaultValue — value when param is missing or invalid
 * @param {object} [options]
 * @param {string[]} [options.allowed] — whitelist of valid string values
 * @param {(s: string) => any} [options.parse] — coerce string → typed value
 * @returns {[value, setValue]}
 *
 * @example
 *   const [days, setDays] = useUrlParam('days', 30, {
 *     allowed: ['7', '15', '30'],
 *     parse: Number,
 *   })
 *
 * @example
 *   const [tab, setTab] = useUrlParam('tab', 'all', {
 *     allowed: ['all', 'expiring'],
 *   })
 */
export function useUrlParam(key, defaultValue, options = {}) {
  const { allowed, parse } = options
  const [searchParams, setSearchParams] = useSearchParams()

  const defaultString = String(defaultValue)
  const rawString = searchParams.get(key)
  const isValid = rawString !== null && (!allowed || allowed.includes(rawString))
  const validString = isValid ? rawString : defaultString
  const value = parse ? parse(validString) : validString

  const setValue = useCallback((newValue) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const newString = newValue === null || newValue === undefined ? '' : String(newValue)
      if (!newString || newString === defaultString) next.delete(key)
      else next.set(key, newString)
      return next
    }, { replace: true })
  }, [setSearchParams, key, defaultString])

  return [value, setValue]
}
