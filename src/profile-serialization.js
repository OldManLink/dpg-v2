const PROFILE_FIELD_ORDER = [
  'version',
  'label',
  'service',
  'account',
  'counter',
  'length',
  'require',
  'symbolSet',
  'notes',
  'createdAt',
  'updatedAt'
]

/**
 * @typedef {import('./profiles-file.js').Profile} Profile
 */

/**
 * @param {Profile} profile
 * @returns {Profile}
 */
export function normalizeProfileFieldOrder(profile) {
  /** @type {Record<string, any>} */
  const ordered = {}

  for (const key of PROFILE_FIELD_ORDER) {
    if (key in profile) {
      ordered[key] = profile[key]
    }
  }

  for (const [key, value] of Object.entries(profile)) {
    if (!(key in ordered)) {
      ordered[key] = value
    }
  }

  return /** @type {Profile} */ (ordered)
}

/**
 * @param {Profile} profile
 * @returns {string}
 */
export function serializeProfilePretty(profile) {
  return JSON.stringify(normalizeProfileFieldOrder(profile), null, 2)
}
