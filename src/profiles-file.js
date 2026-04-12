import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'

/**
 * @param {{ platform?: string, homeDir?: string }=} options
 * @returns {string}
 */
export function resolveProfilesPath(options = {}) {
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

/**
 * @param {unknown} profiles
 * @param {string} label
 * @returns {any}
 */
export function findProfileByLabel(profiles, label) {
  if (!Array.isArray(profiles)) {
    throw new Error('Profiles file must contain a JSON array')
  }

  const match = profiles.find(profile => profile?.label === label)
  if (!match) {
    throw new Error(`Profile not found: ${label}`)
  }

  return match
}

/**
 * @param {string} label
 * @param {{ profilesPath?: string }=} options
 * @returns {Promise<any>}
 */
export async function loadProfileByLabel(label, options = {}) {
  const profilesPath = options.profilesPath ?? resolveProfilesPath()
  let text

  try {
    text = await fs.readFile(profilesPath, 'utf8')
  } catch (error) {
    throw new Error(`Profiles file not found: ${profilesPath}`)
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    throw new Error(`Profiles file is not valid JSON: ${profilesPath}`)
  }

  return findProfileByLabel(parsed, label)
}
