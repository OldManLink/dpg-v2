/**
 * @param {string} value
 * @returns {string}
 */
export function normalizeText(value) {
  return value.normalize('NFC')
}
