import { vi } from 'vitest'

/** @typedef {import('../../src/models.js').Profile} Profile */
/** @typedef {import('../../src/models.js').ProfilesRepositoryFactory} ProfilesRepositoryFactory */
/**
 * @typedef {{
 *   create?: (profile: Profile) => void,
 *   replace?: (profile: Profile) => void,
 *   delete?: (label: string) => void,
 *   persist?: () => Promise<void>
 * }} RepoOverrides
 */

/**
 * @param {Profile[]} initialProfiles
 * @param {RepoOverrides} [overrides]
 * @returns {ProfilesRepositoryFactory & { load: import('vitest').Mock, repo: any }}
 */
export function profilesRepositoryClassMock(initialProfiles, overrides = {}) {
  let profiles = [...initialProfiles]

  const repo = {
    _profiles: [],
    _saveProfiles: undefined,

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

    "findDuplicateDerivedPasswordGroups": () => [],
    ...overrides
  }

  return {
    load: vi.fn(async () => repo),
    repo
  }
}
