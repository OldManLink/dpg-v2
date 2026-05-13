import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
/** @typedef {import('./models.js').Profile} Profile */

/**
 * @param {{ platform?: string, homeDir?: string, profilesPath?: string  }=} options
 * @returns {string}
 */
export function resolveProfilesPath(options = {}) {
  if (options.profilesPath) {
    return options.profilesPath
  }

  const platform = options.platform ?? process.platform
  const homeDir = options.homeDir ?? os.homedir()

  switch (platform) {
    case 'darwin':
    case 'linux':
    case 'win32':
      return path.join(homeDir, '.dpg-v2', 'profiles.json')
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

export async function loadAllProfiles(options = {}) {
  const profilesPath = options.profilesPath ?? resolveProfilesPath()

  let text
  try {
    text = await fs.readFile(profilesPath, 'utf8')
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return []
    }
    throw err
  }

  const parsed = JSON.parse(text)

  if (!Array.isArray(parsed)) {
    throw new Error('Profiles file must contain a JSON array')
  }

  return parsed
}

/**
 * @param {Profile[]} profiles
 * @param {{ profilesPath?: string }=} options
 * @returns {Promise<void>}
 */
export async function saveProfiles(profiles, options = {}) {
  const profilesPath = options.profilesPath ?? resolveProfilesPath()
  const tmpPath = profilesPath + '.tmp'

  const sorted = [...profiles].sort((a, b) =>
    a.label.localeCompare(b.label)
  )

  const json = JSON.stringify(sorted)

  await fs.writeFile(tmpPath, json, 'utf8')
  await fs.rename(tmpPath, profilesPath)
}
