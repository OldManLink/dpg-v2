import { describe, it, expect } from 'vitest'
import path from 'node:path'
import {resolveProfilesPath, loadAllProfiles} from '../src/profiles-file.js'

describe('resolveProfilesPath', () => {
  it('uses ~/.dpg-v2/profiles.json on macOS', async () => {
    const result = resolveProfilesPath({
      platform: 'darwin',
      homeDir: '/Users/peter'
    })

    expect(result).toBe('/Users/peter/.dpg-v2/profiles.json')
  })

  it('uses ~/.dpg-v2/profiles.json on Linux', async () => {
    const result = resolveProfilesPath({
      platform: 'linux',
      homeDir: '/home/peter'
    })

    expect(result).toBe('/home/peter/.dpg-v2/profiles.json')
  })

  it('uses %USERPROFILE%\\.dpg-v2\\profiles.json on Windows', async () => {
    const result = resolveProfilesPath({
      platform: 'win32',
      homeDir: 'C:\\Users\\Peter'
    })

    expect(result).toBe(path.join('C:\\Users\\Peter', '.dpg-v2', 'profiles.json'))
  })

  it('throws for unsupported platform', () => {
    expect( () =>
       resolveProfilesPath({
        platform: 'plan9',
        homeDir: '/tmp'
      })
    ).toThrow(/unsupported platform/i)
  })
})

describe('missing profiles file', () => {
  it('returns empty array when profiles file is missing', async () => {
    const missingPath = path.join('/definitely', 'not-there', 'profiles.json')
    const result = await loadAllProfiles({ profilesPath: missingPath })
    expect(result).toEqual([])
  })
})
