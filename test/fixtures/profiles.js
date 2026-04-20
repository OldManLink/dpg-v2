/** @typedef {import('../../src/models.js').Profile} Profile */

/** @type Profile */
export const DEFAULT_PROFILE = {
  version: 'dpg:v2',
  label: 'github-main',
  service: 'github.com',
  account: 'peter@example.com',
  counter: 1,
  length: 20,
  require: ['lower', 'upper', 'digit', 'symbol'],
  symbolSet: '!@#',
  notes: '',
  createdAt: '2026-04-12T00:00:00.000Z',
  updatedAt: '2026-04-12T00:00:00.000Z'
}

/**
 * @param {Partial<Profile>=} overrides
 * @returns {Profile}
 */
export function makeProfile(overrides = {}) {
  return {
    ...DEFAULT_PROFILE,
    ...overrides
  }
}
