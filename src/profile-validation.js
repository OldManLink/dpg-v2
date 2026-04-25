/** @typedef {import('./models.js').RequireClass} RequireClass */
/** @type RequireClass[] */
export const REQUIRE_CLASS_ORDER = ['lower', 'upper', 'digit', 'symbol']
export const CANONICAL_SYMBOLS = '@%+/!#$^.()[]{}~-_'

const PROFILE_LABEL_RE = /^[A-Za-z0-9._-]+$/
/**
 * @param {string} label
 * @returns {true}
 */
export function validateProfileLabel(label) {
  if (!label || !PROFILE_LABEL_RE.test(label)) {
    throw new Error(
      `Invalid profile label: '${label}'. Labels may contain only letters, digits, dot, underscore, and hyphen.`
    )
  }

  return true
}

/**
 * @param {RequireClass[]} require
 * @returns {RequireClass[]}
 */
export function canonicalRequire(require) {
  /** @type RequireClass[] */
  const ORDER = ['lower', 'upper', 'digit', 'symbol']

  for (const name of require) {
    if (!ORDER.includes(name)) {
      throw new Error(`Unknown character class: '${name}'`)
    }
  }

  return ORDER.filter(name => require.includes(name))
}

/**
 * @param {string} symbolSet
 * @returns {string}
 */
export function canonicalSymbolSet(symbolSet) {
  if (typeof symbolSet !== 'string') {
    throw new Error('symbolSet must be a string')
  }

  if (symbolSet.length === 0) {
    throw new Error('symbolSet must not be empty')
  }

  const seen = new Set()

  for (const ch of symbolSet) {
    if (!CANONICAL_SYMBOLS.includes(ch)) {
      throw new Error(`symbolSet contains invalid character: '${ch}'`)
    }

    if (seen.has(ch)) {
      throw new Error(`symbolSet contains duplicated character: '${ch}'`)
    }

    seen.add(ch)
  }

  return [...CANONICAL_SYMBOLS].filter(ch => seen.has(ch)).join('')
}
