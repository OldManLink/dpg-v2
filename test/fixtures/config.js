/** @typedef {import('../../src/models.js').Config} Config */

/** @type {Config} */
export const DEFAULT_CONFIG = {
  timeout: 0,
  sortBy: 'label'
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
