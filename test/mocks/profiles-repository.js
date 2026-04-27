import { vi } from 'vitest'

/** @typedef {import('../../src/models.js').Profile} Profile */
/** @typedef {import('../../src/models.js').ProfilesRepositoryFactory} ProfilesRepositoryFactory */

/**
 * @param {Profile[]} initialProfiles
 * @param {Partial<{
 *   create: Function,
 *   replace: Function,
 *   delete: Function,
 *   persist: Function
 * }>} [overrides]
 * @returns {ProfilesRepositoryFactory & { load: import('vitest').Mock, repo: any }}
 */
export function profilesRepositoryClassMock(initialProfiles, overrides = {}) {
  let profiles = [...initialProfiles]

  const repo = {
    list: () => [...profiles],

    get: (/** @type {string} */ label) =>
      profiles.find(p => p.label === label) ?? null,

    create: vi.fn(profile => {
      profiles.push(profile)
    }),

    replace: vi.fn(profile => {
      const i = profiles.findIndex(p => p.label === profile.label)
      if (i !== -1) profiles[i] = profile
    }),

    delete: vi.fn(label => {
      profiles = profiles.filter(p => p.label !== label)
    }),

    persist: vi.fn(async () => {
    }),

    ...overrides
  }

  return {
    load: vi.fn(async () => repo),
    repo
  }
}
