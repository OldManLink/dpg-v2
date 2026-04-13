import { describe, it, expect, vi } from 'vitest'
import { runCli } from '../src/cli-runner.js'
import { DEFAULT_PROFILE } from './fixtures/profiles.js'
import { makeCliArgs } from './fixtures/cli.js'

describe('runCli', () => {
  it('loads profile, prompts for password, generates, copies, and prints success', async () => {
    const loadProfileByLabel = vi.fn(async () => DEFAULT_PROFILE)
    const promptForMasterPassword = vi.fn(async () => 'master')
    const generatePassword = vi.fn(async () => 'generated-secret')
    const copyToClipboard = vi.fn(async () => {})
    const stdout = { write: vi.fn() }
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ profileLabel: 'github-main', show: false, help: false }),
      {
        loadProfileByLabel,
        promptForMasterPassword,
        generatePassword,
        copyToClipboard,
        stdout,
        stderr
      }
    )

    expect(exitCode).toBe(0)
    expect(loadProfileByLabel).toHaveBeenCalledWith('github-main')
    expect(promptForMasterPassword).toHaveBeenCalled()
    expect(generatePassword).toHaveBeenCalledWith('master', DEFAULT_PROFILE)
    expect(copyToClipboard).toHaveBeenCalledWith('generated-secret')
    expect(stdout.write).toHaveBeenCalledWith(expect.stringMatching(/copied to clipboard/i))
  })

  it('prints password when --show is used', async () => {
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ profileLabel: 'github-main', show: true, help: false }),
      {
        loadProfileByLabel: async () => DEFAULT_PROFILE,
        promptForMasterPassword: async () => 'master',
        generatePassword: async () => 'generated-secret',
        copyToClipboard: async () => {},
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining('generated-secret'))
  })

  it('prints help and exits 0', async () => {
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ profileLabel: null, show: false, help: true }),
      {
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(stdout.write).toHaveBeenCalledWith(expect.stringMatching(/usage:/i))
  })

  it('prints error and exits 1 on failure', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ profileLabel: 'missing', show: false, help: false }),
      {
        loadProfileByLabel: async () => {
          throw new Error('Profile not found: missing')
        },
        promptForMasterPassword: async () => 'master',
        generatePassword: async () => 'generated-secret',
        copyToClipboard: async () => {},
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/profile not found/i))
  })
})
