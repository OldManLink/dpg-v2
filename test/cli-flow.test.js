import { describe, it, expect, vi } from 'vitest'
import { runCli } from '../src/cli-runner.js'
import {DEFAULT_PROFILE, makeProfile} from './fixtures/profiles.js'
import { makeCliArgs } from './fixtures/cli.js'
import {createDefaultProfile} from "../src/profile-factory.js";

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

  it('creates a new profile', async () => {

    /** @type {import('../src/profiles-file.js').Profile[] | null} */
    let savedProfiles = null
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ create: 'github-main' }),
      {
        loadAllProfiles: async () => [],
        saveProfiles: async profiles => { savedProfiles = profiles },
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)

    if (!savedProfiles) throw new Error('not saved')
    /** @type {import('../src/profiles-file.js').Profile} */
    const savedProfile = savedProfiles[0]

    expect(savedProfiles).toHaveLength(1)
    expect(savedProfile.label).toBe('github-main')
    expect(stdout.write).toHaveBeenCalledWith("Created profile 'github-main'\n")
  })

  it('fails when creating a duplicate profile', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ create: 'github-main' }),
      {
        loadAllProfiles: async () => [makeProfile({ label: 'github-main' })],
        saveProfiles: async () => {},
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/already exists/i))
  })

  it('new profile is visible in list output', async () => {
    const created = createDefaultProfile('github-main', '2026-04-14T12:00:00.000Z')
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ list: true }),
      {
        loadAllProfiles: async () => [created],
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(stdout.write).toHaveBeenCalledWith(expect.stringMatching(/github-main/))
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

  it('does not report saved if save fails', async () => {
    const profile = makeProfile({ label: 'github', counter: 5 })

    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ bump: 'github', save: true }),
      {
        loadProfileByLabel: async () => profile,
        loadAllProfiles: async () => [profile],
        saveProfiles: async () => {
          throw new Error('disk full')
        },
        generatePassword: async () => 'pw',
        copyToClipboard: async () => {},
        promptForMasterPassword: async () => 'master',
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(1)

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).not.toMatch(/\(saved\)/)
  })

  it('updates updatedAt when saved', async () => {
    const profile = makeProfile({
      label: 'github',
      counter: 5,
      updatedAt: '2020-01-01T00:00:00.000Z'
    })

    /** @type {import('../src/profiles-file.js').Profile[] | null} */
    let savedProfiles = null

    await runCli(
      makeCliArgs({ bump: 'github', save: true }),
      {
        loadProfileByLabel: async () => profile,
        loadAllProfiles: async () => [profile],
        saveProfiles: async p => { savedProfiles = p },
        generatePassword: async () => 'pw',
        copyToClipboard: async () => {},
        promptForMasterPassword: async () => 'master',
        stdout: { write: () => {} },
        stderr: { write: () => {} }
      }
    )

    if (!savedProfiles) throw new Error('not saved')

    /** @type {import('../src/profiles-file.js').Profile} */
    const savedProfile = savedProfiles[0]

    expect(savedProfile.updatedAt).not.toBe(profile.updatedAt)
  })

  it('fails if profile does not exist', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ bump: 'nope' }),
      {
        loadProfileByLabel: async () => {
          throw new Error('Profile not found: nope')
        },
        stderr,
        stdout: { write: () => {} }
      }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/not found/i))
  })

  it('fails when no command is specified', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs(), // all defaults → no profile, no bump, no list
      {
        stderr,
        stdout: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(
      expect.stringMatching(/no command/i)
    )
  })

  it('treats missing profiles file as empty list', async () => {
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ list: true }),
      {
        loadAllProfiles: async () => [],
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(stdout.write).toHaveBeenCalledWith(expect.stringMatching(/no profiles/i))
  })
})
