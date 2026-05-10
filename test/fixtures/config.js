/** @typedef {import('../../src/models.js').Config} Config */

/** @type {Config} */
export const DEFAULT_CONFIG = {
  editor: '',
  hashAbbrev: 7,
  sortBy: 'label',
  timeout: 0
}

/**
 * @param {Partial<Config>=} overrides
 * @returns {Config}
 */
export function makeConfig(overrides = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...overrides
  }
}
