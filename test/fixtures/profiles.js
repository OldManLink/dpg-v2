/** @typedef {import('../../src/models.js').Profile} Profile */
/** @typedef {import('../../src/models.js').EditableProfileFields} EditableProfileFields */

/** @type Profile */
export const DEFAULT_PROFILE = {
  version: 'dpg:v2',
  label: 'github-main',
  service: 'github.com',
  account: 'peter@example.com',
  counter: 1,
  length: 20,
  require: ['lower', 'upper', 'digit', 'symbol'],
  symbolSet: '@!#',
  notes: '',
  createdAt: '2026-04-12T00:00:00.000Z',
  updatedAt: '2026-04-12T00:00:00.000Z'
}

/** @type EditableProfileFields */
export const DEFAULT_PROFILE_EDITABLE_FIELDS = {
  service: 'github.com',
  account: 'peter@example.com',
  counter: 1,
  length: 20,
  require: ['lower', 'upper', 'digit', 'symbol'],
  symbolSet: '@!#'
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

/**
 * @param {Partial<EditableProfileFields>=} overrides
 * @returns {EditableProfileFields}
 */
export function makeEditableProfileFields(overrides = {}) {
  return {
    ...DEFAULT_PROFILE_EDITABLE_FIELDS,
    ...overrides
  }
}
