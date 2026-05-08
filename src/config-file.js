import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
/** @typedef {import('./models.js').Config} Config */

function resolveConfigPath(options = {}) {
  return options.configPath ?? path.join(os.homedir(), '.dpg-v2', 'config.json')
}

/**
 * @returns {Config}
 */
export function defaultConfig() {
  return {
    editor: '',
    hashAbbrev: 7,
    sortBy: 'label',
    timeout: 0
  }
}

/**
 * @param {string} text
 * @returns {{ key: string, value: string }}
 */
export function parseConfigAssignment(text) {
  const trimmed = text.trim()
  const equals = trimmed.indexOf('=')

  if (equals === -1) {
    throw new Error('Config update must use key=value syntax')
  }

  const key = trimmed.slice(0, equals).trim()
  const value = trimmed.slice(equals + 1).trim()

  if (!key) {
    throw new Error('Missing config key')
  }

  if (!value) {
    throw new Error(`Missing value for config key '${key}'`)
  }

  return { key, value }
}

/**
 * @param {Config} config
 * @param {string} key
 * @param {string} value
 * @returns {Config}
 */
export function applyConfigUpdate(config, key, value) {
  if (key === 'editor') {
    if (!value) {
      throw new Error(`No editor specified`)
    }

    return {
      ...config,
      editor: value
    }
  }

  if (key === 'hashAbbrev') {
    const parsed = Number(value)

    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error('hashAbbrev must be a positive integer')
    }

    return {
      ...config,
      hashAbbrev: parsed
    }
  }
  if (key === 'sortBy') {
    if (value !== 'label') {
      throw new Error(`Unsupported sortBy value: '${value}'`)
    }

    return {
      ...config,
      sortBy: 'label'
    }
  }

  if (key === 'timeout') {
    if (!/^\d+$/.test(value)) {
      throw new Error(`Invalid timeout: '${value}'. Timeout must be a non-negative integer.`)
    }

    return {
      ...config,
      timeout: Number(value)
    }
  }


  throw new Error(`Unknown config key: '${key}'`)
}

/**
 * @param {{ configPath?: string }=} options
 * @returns {Promise<Config>}
 */
export async function loadConfig(options = {}) {
  const configPath = resolveConfigPath(options)

  let text
  try {
    text = await fs.readFile(configPath, 'utf8')
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return defaultConfig()
    }
    throw err
  }

  const parsed = JSON.parse(text)

  return {
    editor: parsed.editor ?? '',
    hashAbbrev: parsed.hashAbbrev ?? 7,
    sortBy: parsed.sortBy ?? 'label',
    timeout: parsed.timeout ?? 0
  }
}

/**
 * @param {Config} config
 * @param {{ configPath?: string }=} options
 * @returns {Promise<void>}
 */
export async function saveConfig(config, options = {}) {
  const configPath = resolveConfigPath(options)
  const dir = path.dirname(configPath)
  const tmpPath = configPath + '.tmp'

  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(tmpPath, JSON.stringify({
    editor: config.editor ?? '',
    hashAbbrev: config.hashAbbrev,
    sortBy: config.sortBy,
    timeout: config.timeout
  }, null, 2), 'utf8')
  await fs.rename(tmpPath, configPath)
}
