import { ByteStream } from './stream.js'
import { uniformIndex } from './uniform.js'
import { deterministicShuffle } from './shuffle.js'
/** @typedef {import('./models.js').Profile} Profile */
/** @typedef {import('./models.js').RequireClass} RequireClass */

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGIT = '0123456789'

/**
 * @param {string} name
 * @param {string} symbolSet
 * @returns {string}
 */
function getClassAlphabet(name, symbolSet) {
  switch (name) {
    case 'lower':
      return LOWER
    case 'upper':
      return UPPER
    case 'digit':
      return DIGIT
    case 'symbol':
      return symbolSet
    default:
      throw new Error(`Unknown character class: ${name}`)
  }
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
      throw new Error(`Unknown character class: ${name}`)
    }
  }

  return ORDER.filter(name => require.includes(name))
}

/**
 * @param {RequireClass[]} require
 * @param {string} symbolSet
 * @returns {string}
 */
function buildAlphabet(require, symbolSet) {
  return canonicalRequire(require)
    .map(name => getClassAlphabet(name, symbolSet))
    .join('')
}

/**
 * @param {ByteStream} stream
 * @param {string} alphabet
 * @returns {string}
 */

function pickChar(stream, alphabet) {
  return alphabet[uniformIndex(stream, alphabet.length)]
}

/**
 * @param {Uint8Array} siteKey
 * @param {Profile} profile
 * @returns {string}
 */
export function generatePasswordFromSiteKey(siteKey, profile) {
  const require = canonicalRequire(profile.require ?? [])
  const length = profile.length
  const symbolSet = profile.symbolSet ?? '!#$%&*+-=?@^_'

  if (!Number.isInteger(length) || length < 1) {
    throw new Error('length must be a positive integer')
  }

  if (require.length === 0) {
    throw new Error('At least one character class must be enabled')
  }

  if (length < require.length) {
    throw new Error('length must be at least the number of required classes')
  }

  const alphabet = buildAlphabet(require, symbolSet)
  if (!alphabet) {
    throw new Error('Effective alphabet must not be empty')
  }

  const stream = new ByteStream(siteKey)
  /** @type string[] */
  const chars = []

  for (const className of require) {
    const classAlphabet = getClassAlphabet(className, symbolSet)
    chars.push(pickChar(stream, classAlphabet))
  }

  while (chars.length < length) {
    chars.push(pickChar(stream, alphabet))
  }

  deterministicShuffle(chars, stream)
  return chars.join('')
}
