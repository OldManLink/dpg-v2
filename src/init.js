import fs from 'node:fs/promises'
import { defaultConfig, loadConfig, saveConfig, resolveConfigPath } from './config-file.js'
import { loadAllProfiles, saveProfiles, resolveProfilesPath } from './profiles-file.js'

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
    const config = await loadConfig()
    const normalized = {
      ...defaultConfig(),
      ...config
    }

    if (JSON.stringify(normalized) !== JSON.stringify(config)) {
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
