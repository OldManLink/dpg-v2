import { vi } from 'vitest'

/** @typedef {import('../../src/models.js').Profile} Profile */
/** @typedef {import('../../src/models.js').ProfilesRepositoryFactory} ProfilesRepositoryFactory */

/**
 * @param {Profile[]} initialProfiles
 * @returns {ProfilesRepositoryFactory & { load: import('vitest').Mock }}
 */
export function profilesRepositoryClassMock(initialProfiles) {
  let profiles = [...initialProfiles]

  return {
    load: vi.fn(async () => ({
      list: () => [...profiles],

      get: (/** @type {string} */ label) =>
        profiles.find(p => p.label === label) ?? null,

      create: (profile) => {
        profiles.push(profile)
      },

      replace: (profile) => {
        const i = profiles.findIndex(p => p.label === profile.label)
        if (i !== -1) profiles[i] = profile
      },

      delete: (/** @type {string} */ label) => {
        profiles = profiles.filter(p => p.label !== label)
      },

      persist: vi.fn(async () => {})
    }))
  }
}
