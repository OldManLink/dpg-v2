import {describe, it, expect, vi} from "vitest";
import {makeConfig} from "./fixtures/config.js";
import {makeCliArgs} from "./fixtures/cli.js";
import {runCli} from "../src/cli-runner.js";
/** @typedef {import('../src/models.js').Config} Config */
/** @typedef {import('../src/models.js').Profile} Profile */

describe('list command', () => {
  it('shows current config as pretty JSON', async () => {
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ configPresent: true, configArg: null }),
      {
        loadConfig: async () => makeConfig({ timeout: 900 }),
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    const parsed = JSON.parse(output)

    expect(parsed).toEqual({
      editor: '',
      hashAbbrev: 7,
      sortBy: 'label',
      timeout: 900
    })
  })

  it('updates timeout config and persists it', async () => {
    /** @type {import('../src/models.js').Config | null} */
    let savedConfig = null
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ configPresent: true, configArg: 'timeout=900' }),
      {
        loadConfig: async () => makeConfig(),
        saveConfig: async config => { savedConfig = config },
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(savedConfig).toEqual({
      editor: '',
      hashAbbrev: 7,
      sortBy: 'label',
      timeout: 900
    })
    expect(stdout.write).toHaveBeenCalledWith('Updated config: timeout=900\n')
  })

  it('updates sortBy config and persists it', async () => {
    /** @type {import('../src/models.js').Config | null} */
    let savedConfig = null
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ configPresent: true, configArg: 'sortBy=label' }),
      {
        loadConfig: async () => makeConfig(),
        saveConfig: async config => { savedConfig = config },
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(savedConfig).toEqual({
      editor: '',
      hashAbbrev: 7,
      sortBy: 'label',
      timeout: 0
    })
    expect(stdout.write).toHaveBeenCalledWith('Updated config: sortBy=label\n')
  })

  it('fails for unknown config key', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ configPresent: true, configArg: 'wat=x' }),
      {
        loadConfig: async () => makeConfig(),
        saveConfig: async () => {},
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/unknown config key/i))
  })

  it('fails for invalid timeout', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ configPresent: true, configArg: 'timeout=abc' }),
      {
        loadConfig: async () => makeConfig(),
        saveConfig: async () => {},
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/invalid timeout/i))
  })

  it('updates editor config and persists it', async () => {
    let savedConfig = null
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ configPresent: true, configArg: 'editor=nano' }),
      {
        loadConfig: async () => makeConfig(),
        saveConfig: async config => { savedConfig = config },
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(savedConfig).toEqual({
      editor: 'nano',
      hashAbbrev: 7,
      sortBy: 'label',
      timeout: 0
    })
    expect(stdout.write).toHaveBeenCalledWith('Updated config: editor=nano\n')
  })
})
