/** @typedef {import('./models.js').Profile} Profile */
/** @typedef {import('./models.js').RequireClass} RequireClass */
/**
 * @param {Profile} profile
 * @returns {Uint8Array<ArrayBuffer>}
 */
export function encodeContext(profile) {
  const encoder = new TextEncoder()

  /**
   * @param {string} str
   * @returns {string}
   */
  function field(str) {
    const bytes = encoder.encode(str)
    return `${bytes.length}:${str}\0`
  }

  /**
   * @param {RequireClass[]} req
   * @returns {string}
   */
  function normalizeRequire(req) {
    /** @type RequireClass[] */
    const order = ['lower', 'upper', 'digit', 'symbol']
    return order.filter(x => req.includes(x)).join(',')
  }

  const parts = [
    'DPGCTX\0',
    field(profile.version),
    field(profile.service),
    field(profile.account || ''),
    field(String(profile.counter)),
    field(String(profile.length)),
    field(normalizeRequire(profile.require)),
    field(profile.symbolSet || '')
  ]

  return encoder.encode(parts.join(''))
}

