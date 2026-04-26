import {it, expect, describe} from 'vitest'
import {ProfilesRepository} from "../src/profiles-repository.js";
import {loadAllProfiles} from "../src/profiles-file.js";
import {makeProfile} from "./fixtures/profiles.js";
/** @typedef {import('../src/models.js').Profile} Profile */

describe('ProfilesRepository methods', () => {
  it('loads profiles and lists them', async () => {
    const repo = await ProfilesRepository.load({loadAllProfiles})

    const profiles = repo.list()

    expect(profiles.length).toBeGreaterThan(0)
  })

  it('returns profile by label', async () => {
    const repo = await ProfilesRepository.load({loadAllProfiles})

    const profile = repo.get('github-main')

    expect(profile.label).toBe('github-main')
  })

  it('creates a new profile', async () => {
    const repo = await ProfilesRepository.load({loadAllProfiles})

    repo.create(makeProfile({label: 'new-profile'}))

    expect(repo.get('new-profile')).not.toBeNull()
  })

  it('replaces an existing profile', async () => {
    const repo = await ProfilesRepository.load({loadAllProfiles})

    const updated = makeProfile({label: 'github-main', counter: 42})

    repo.replace(updated)

    expect(repo.get('github-main').counter).toBe(42)
  })

  it('deletes a profile', async () => {
    const repo = await ProfilesRepository.load({loadAllProfiles})

    repo.delete('github-main')

    expect(repo.get('github-main')).toBeNull()
  })

  it('persists profiles', async () => {
    /** @type {Profile[]} */
    let saved = null

    const repo = await ProfilesRepository.load({
      loadAllProfiles,
      saveProfiles: async profiles => {
        saved = profiles
      }
    })

    repo.create(makeProfile({label: 'new-profile'}))
    await repo.persist()

    expect(saved.some(p => p.label === 'new-profile')).toBe(true)
  })
})
