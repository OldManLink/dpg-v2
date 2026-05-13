import fs from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { describe, it, expect } from 'vitest'
import {
  defaultConfig,
  loadConfig,
  saveConfig,
  parseConfigAssignment,
  applyConfigUpdate
} from '../src/config-file.js'
import { makeConfig } from './fixtures/config.js'

describe('defaultConfig', () => {
  it('returns the default config', () => {
    expect(defaultConfig()).toEqual({
      editor: '',
      hashAbbrev: 7,
      sortBy: 'label',
      timeout: 90,
    })
  })
})

describe('loadConfig', () => {
  it('returns default config when file is missing', async () => {
    const configPath = path.join(tmpdir(), `dpg-missing-${Date.now()}.json`)
    const config = await loadConfig({ configPath })
    expect(config).toEqual(defaultConfig())
  })
})

describe('parseConfigAssignment', () => {
  it('parses timeout=900', () => {
    expect(parseConfigAssignment('timeout=900')).toEqual({
      key: 'timeout',
      value: '900'
    })
  })

  it('trims whitespace around key and value', () => {
    expect(parseConfigAssignment(' timeout = 900 ')).toEqual({
      key: 'timeout',
      value: '900'
    })
  })

  it('rejects missing value', () => {
    expect(() => parseConfigAssignment('timeout=')).toThrow(/missing value/i)
  })

  it('rejects missing equals', () => {
    expect(() => parseConfigAssignment('timeout')).toThrow(/key=value/i)
  })
})

describe('applyConfigUpdate', () => {
  it('updates timeout', () => {
    expect(applyConfigUpdate(defaultConfig(), 'timeout', '900')).toEqual({
      editor: '',
      hashAbbrev: 7,
      sortBy: 'label',
      timeout: 900,
    })
  })

  it('rejects manual updates to hashAbbrev', () => {
    expect(() =>
      applyConfigUpdate(defaultConfig(), 'hashAbbrev', '8')
    ).toThrow(
      /Config key 'hashAbbrev' is managed by DPG and cannot be changed manually/
    )
  })

  it('updates sortBy', () => {
    expect(applyConfigUpdate(defaultConfig(), 'sortBy', 'label')).toEqual({
      editor: '',
      hashAbbrev: 7,
      sortBy: 'label',
      timeout: 90
    })
  })

  it('updates editor', () => {
    expect(applyConfigUpdate(defaultConfig(), 'editor', 'nano')).toEqual({
      editor: 'nano',
      hashAbbrev: 7,
      sortBy: 'label',
      timeout: 90
    })
  })

  it('allows empty editor value only when loaded from defaults, not via key=value update', () => {
    expect(() => applyConfigUpdate(defaultConfig(), 'editor', '')).toThrow(/No editor/i)
  })

  it('rejects unknown key', () => {
    expect(() => applyConfigUpdate(defaultConfig(), 'wat', 'x')).toThrow(/unknown config key/i)
  })

  it('rejects invalid timeout', () => {
    expect(() => applyConfigUpdate(defaultConfig(), 'timeout', 'abc')).toThrow(/invalid.*timeout/i)
  })

  it('rejects negative timeout', () => {
    expect(() => applyConfigUpdate(defaultConfig(), 'timeout', '-1')).toThrow(/non-negative/i)
  })

  it('rejects unsupported sortBy', () => {
    expect(() => applyConfigUpdate(defaultConfig(), 'sortBy', 'updatedAt')).toThrow(/unsupported.*sortBy/i)
  })
})

describe('saveConfig', () => {
  it('persists config using atomic write', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'dpg-config-'))
    const configPath = path.join(dir, 'config.json')

    await saveConfig(makeConfig({ timeout: 900 }), { configPath })

    const text = await fs.readFile(configPath, 'utf8')
    expect(JSON.parse(text)).toEqual({
      editor: '',
      hashAbbrev: 7,
      sortBy: 'label',
      timeout: 900
    })
  })
})
