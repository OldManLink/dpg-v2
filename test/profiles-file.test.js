import { describe, it, expect } from 'vitest'
import { tmpdir } from 'node:os'
import fs from 'node:fs/promises'
import { mkdtemp } from 'node:fs/promises'
import path from 'node:path'
import {resolveProfilesPath, findProfileByLabel, loadProfileByLabel, loadAllProfiles} from '../src/profiles-file.js'
import { makeProfile } from './fixtures/profiles.js'

describe('resolveProfilesPath', () => {
  it('uses ~/.dpg-v2/profiles.json on macOS', () => {
    const result = resolveProfilesPath({
      platform: 'darwin',
      homeDir: '/Users/peter'
    })

    expect(result).toBe('/Users/peter/.dpg-v2/profiles.json')
  })

  it('uses ~/.dpg-v2/profiles.json on Linux', () => {
    const result = resolveProfilesPath({
      platform: 'linux',
      homeDir: '/home/peter'
    })

    expect(result).toBe('/home/peter/.dpg-v2/profiles.json')
  })

  it('uses %USERPROFILE%\\.dpg-v2\\profiles.json on Windows', () => {
    const result = resolveProfilesPath({
      platform: 'win32',
      homeDir: 'C:\\Users\\Peter'
    })

    expect(result).toBe(path.join('C:\\Users\\Peter', '.dpg-v2', 'profiles.json'))
  })

  it('throws for unsupported platform', () => {
    expect(() =>
      resolveProfilesPath({
        platform: 'plan9',
        homeDir: '/tmp'
      })
    ).toThrow(/unsupported platform/i)
  })
})

describe('findProfileByLabel', () => {
  it('returns the matching profile', () => {
    const profiles = [
      makeProfile({ label: 'github-main' }),
      makeProfile({ label: 'gitlab-main', service: 'gitlab.com' })
    ]

    const result = findProfileByLabel(profiles, 'github-main')

    expect(result.label).toBe('github-main')
    expect(result.service).toBe('github.com')
  })

  it('throws if profile is not found', () => {
    const profiles = [makeProfile({ label: 'github-main' })]

    expect(() => findProfileByLabel(profiles, 'missing'))
      .toThrow(/profile not found/i)
  })

  it('throws if profiles root is not an array', () => {
    expect(() => findProfileByLabel({}, 'github-main'))
      .toThrow(/array/i)
  })
})

describe('loadProfileByLabel', () => {
  it('loads a matching profile from disk', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'dpg-'))
    const profilesPath = path.join(dir, 'profiles.json')

    await fs.writeFile(
      profilesPath,
      JSON.stringify([
        makeProfile({ label: 'github-main' }),
        makeProfile({ label: 'gitlab-main', service: 'gitlab.com' })
      ]),
      'utf8'
    )

    const result = await loadProfileByLabel('gitlab-main', { profilesPath })

    expect(result.label).toBe('gitlab-main')
    expect(result.service).toBe('gitlab.com')
  })

  it('returns empty array when profiles file is missing', async () => {
    const missingPath = path.join('/definitely', 'not-there', 'profiles.json')
    const result = await loadAllProfiles({ profilesPath: missingPath })
    expect(result).toEqual([])
  })
})
