import fs from 'node:fs/promises'
import {defaultConfig, loadRawConfig, resolveConfigPath, saveConfig} from './config-file.js'
import {loadAllProfiles, resolveProfilesPath, saveProfiles} from './profiles-file.js'

/**
 * @param {string} path
 * @returns Promise<boolean>
 * */
async function exists(path) {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

/**
 * @returns {Promise<{
 *   createdConfig: boolean,
 *   updatedConfig: boolean,
 *   createdProfiles: boolean
 * }>}
 */
export async function initializeStorage() {
  let createdConfig = false
  let updatedConfig = false
  let createdProfiles = false

  if (!(await exists(resolveConfigPath()))) {
    await saveConfig(defaultConfig())
    createdConfig = true
  } else {
    const rawConfig = await loadRawConfig()

    const normalized = {
      ...defaultConfig(),
      ...rawConfig
    }

    if (JSON.stringify(normalized) !== JSON.stringify(rawConfig)) {
      await saveConfig(normalized)
      updatedConfig = true
    }
  }

  if (!(await exists(resolveProfilesPath()))) {
    await saveProfiles([])
    createdProfiles = true
  } else {
    await loadAllProfiles()
  }

  return {
    createdConfig,
    updatedConfig,
    createdProfiles
  }
}
