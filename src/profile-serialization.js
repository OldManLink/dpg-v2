/** @typedef {import('./models.js').Profile} Profile */
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
  'updatedAt',
  'ctxHash'
]

/**
 * @param {Profile} profile
 * @returns {Profile}
 */
export function normalizeProfileFieldOrder(profile) {
  /** @type Partial<Profile> */
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

  // At this point, all required fields should be present, so cast is safe.
  return /** @type Profile */ (ordered)
}

/**
 * @param {Profile} profile
 * @returns {string}
 */
export function serializeProfilePretty(profile) {
  return JSON.stringify(normalizeProfileFieldOrder(profile), null, 2)
}
