import {it, expect, describe} from 'vitest'
import {ProfilesRepository} from "../src/profiles-repository.js";
import {makeProfile} from "./fixtures/profiles.js";
import fs from 'node:fs/promises'
import path from "node:path";
import { tmpdir } from "node:os";
import { loadAllProfiles, saveProfiles } from '../src/profiles-file.js'
/** @typedef {import('../src/models.js').Profile} Profile */

const _loadAllProfiles = async () => [makeProfile({label: 'github-main'})]

describe('ProfilesRepository methods', () => {
  it('loads profiles and lists them', async () => {
    const repo = await ProfilesRepository.load({loadAllProfiles: _loadAllProfiles})

    expect(repo.list()).toHaveLength(1)
  })

  it('returns profile by label', async () => {
    const repo = await ProfilesRepository.load({loadAllProfiles: _loadAllProfiles})

    expect(repo.get('github-main')?.label).toBe('github-main')
  })

  it('creates a new profile', async () => {
    const repo = await ProfilesRepository.load({loadAllProfiles: _loadAllProfiles})

    repo.create(makeProfile({label: 'new-profile'}))

    expect(repo.get('new-profile')).not.toBeNull()
  })

  it('replaces an existing profile', async () => {
    const repo = await ProfilesRepository.load({loadAllProfiles: _loadAllProfiles})

    repo.replace(makeProfile({label: 'github-main', counter: 42}))

    expect(repo.get('github-main')?.counter).toBe(42)
  })

  it('deletes a profile', async () => {
    const repo = await ProfilesRepository.load({loadAllProfiles: _loadAllProfiles})

    repo.delete('github-main')

    expect(repo.get('github-main')).toBeNull()
  })

  it('persists profiles', async () => {
    /** @type {Profile[]} */
    let saved = null

    const repo = await ProfilesRepository.load({
      loadAllProfiles: _loadAllProfiles,
      saveProfiles: async profiles => {
        saved = profiles
      }
    })

    repo.create(makeProfile({label: 'new-profile'}))
    await repo.persist()

    expect(saved.some(p => p.label === 'new-profile')).toBe(true)
  })

  it('creates profiles file when none exists', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'dpg-'))
    const profilesPath = path.join(dir, 'profiles.json')

    const repo = await ProfilesRepository.load({
      loadAllProfiles: () => loadAllProfiles({ profilesPath }),
      saveProfiles: profiles => saveProfiles(profiles, { profilesPath })
    })

    repo.create(makeProfile({ label: 'github-main' }))
    await repo.persist()

    const saved = JSON.parse(await fs.readFile(profilesPath, 'utf8'))
    expect(saved).toHaveLength(1)
  })

  it('throws when replacing non-existent profile', async () => {
    const repo = await ProfilesRepository.load({
      loadAllProfiles: async () => []
    })

    expect(() =>
      repo.replace(makeProfile({ label: 'ghost' }))
    ).toThrow(/does not exist/)
  })

  it('throws when creating duplicate label', async () => {
    const repo = await ProfilesRepository.load({
      loadAllProfiles: async () => [
        makeProfile({ label: 'github' })
      ]
    })

    expect(() =>
      repo.create(makeProfile({ label: 'github' }))
    ).toThrow(/already exists/)
  })


  it('throws when deleting non-existent profile', async () => {
    const repo = await ProfilesRepository.load({
      loadAllProfiles: async () => []
    })

    expect(() =>
      repo.delete('ghost')
    ).toThrow(/does not exist/)
  })
})
