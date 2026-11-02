const MAX_LENGTH = 2000

/**
 * The document link is optional: an empty string is valid. Anything else must be an
 * https URL, so a pasted `javascript:` or `data:` link can never become a clickable link.
 */
export function isValidDocUrl(value: string): boolean {
  const v = value.trim()
  if (v === '') return true
  if (v.length > MAX_LENGTH || /\s/.test(v)) return false
  try {
    return new URL(v).protocol === 'https:'
  } catch {
    return false
  }
}
