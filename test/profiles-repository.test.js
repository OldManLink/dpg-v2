import {it, expect, describe} from 'vitest'
import {ProfilesRepository} from "../src/profiles-repository.js";
import {makeProfile} from "./fixtures/profiles.js";
import fs from 'node:fs/promises'
import path from "node:path";
import { tmpdir } from "node:os";
import { loadAllProfiles, saveProfiles } from '../src/profiles-file.js'
/** @typedef {import('../src/models.js').Profile} Profile */
/** @typedef {import('../src/models.js').Config} Config */

const _loadAllProfiles = async () => [makeProfile({label: 'github-main'})]

describe('ProfilesRepository CRUD methods', () => {
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
      loadAllProfiles: () => loadAllProfiles({profilesPath}),
      saveProfiles: profiles => saveProfiles(profiles, {profilesPath})
    })

    repo.create(makeProfile({label: 'github-main'}))
    await repo.persist()

    const saved = JSON.parse(await fs.readFile(profilesPath, 'utf8'))
    expect(saved).toHaveLength(1)
  })
})

describe('ProfilesRepository duplicate detection', () => {
  it('detects two profiles with identical canonical contexts', async () => {
    const repo = await ProfilesRepository.load({
      loadAllProfiles: async () => [
        makeProfile({label: 'github-home', service: 'github.com', counter: 1}),
        makeProfile({label: 'github-work', service: 'github.com', counter: 1})
      ]
    })

    let groups = repo.findDuplicateDerivedPasswordGroups();
    expect(groups).toHaveLength(1)
    expect(groups[0]).toEqual(['github-home', 'github-work'])
  })

  it('detects two out of three profiles with almost identical canonical contexts', async () => {
    const repo = await ProfilesRepository.load({
      loadAllProfiles: async () => [
        makeProfile({label: 'a', service: 'x', counter: 1}),
        makeProfile({label: 'b', service: 'x', counter: 1}),
        makeProfile({label: 'c', service: 'y', counter: 1})
      ]
    })

    let groups = repo.findDuplicateDerivedPasswordGroups();
    expect(groups).toHaveLength(1)
    expect(groups[0]).toEqual(['a', 'b'])
  })

  it('does not report profiles with different canonical contexts', async () => {
    const repo = await ProfilesRepository.load({
      loadAllProfiles: async () => [
        makeProfile({label: 'a', service: 'a.example', counter: 1}),
        makeProfile({label: 'b', service: 'b.example', counter: 1})
      ]
    })

    let groups = repo.findDuplicateDerivedPasswordGroups();
    expect(groups).toHaveLength(0)
  })

  it('confirms duplicates by comparing canonical contexts within ctxHash buckets', async () => {
    const repo = await ProfilesRepository.load({
      loadAllProfiles: async () => [
        makeProfile({label: 'a', service: 'a.example', ctxHash: 'forced-collision'}),
        makeProfile({label: 'b', service: 'b.example', ctxHash: 'forced-collision'})
      ]
    })

    expect(repo.findDuplicateDerivedPasswordGroups()).toEqual([])
  })

  it('uses labels in deterministic order', async () => {
    const repo = await ProfilesRepository.load({
      loadAllProfiles: async () => [
        makeProfile({label: 'zeta', service: 'same'}),
        makeProfile({label: 'alpha', service: 'same'})
      ]
    })
    expect(repo.findDuplicateDerivedPasswordGroups()).toEqual([
      ['alpha', 'zeta']
    ])
  })

  it('backfills ctxHash on load', async () => {
    const repo = await ProfilesRepository.load({
      loadAllProfiles: async () => [
        makeProfile({ label: 'a' }) // no ctxHash
      ]
    })

    const p = repo.list()[0]

    expect(p.ctxHash).toBeDefined()
  })
})

describe('ProfilesRepository exceptions', () => {
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

  it('expands hashAbbrev and rewrites profile hashes on abbreviated collision', async () => {
    /** @type {Config | null} */
    let savedConfig = null

    /** @type {Profile[] | null} */
    let savedProfiles = null

    const repo = new ProfilesRepository(
      [
        makeProfile({ label: 'a', ctxHash: 'abc' }),
        makeProfile({ label: 'b', ctxHash: 'abc' })
      ],
      {
        config: { timeout: 90, sortBy: 'label', editor: '', hashAbbrev: 3 },
        findRequiredHashAbbrev: () => 4,
        saveConfig: async config => { savedConfig = config },
        saveProfiles: async profiles => { savedProfiles = profiles }
      }
    )
    await repo.persist()

    expect(savedConfig.hashAbbrev).toBeGreaterThan(3)
    expect(savedProfiles.every(p => p.ctxHash.length === savedConfig.hashAbbrev)).toBe(true)
  })
})
