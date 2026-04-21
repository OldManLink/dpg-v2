import { describe, it, expect, vi } from 'vitest'
import { runCli } from '../src/cli-runner.js'
import {DEFAULT_PROFILE, makeProfile} from './fixtures/profiles.js'
import { makeCliArgs } from './fixtures/cli.js'
import {createDefaultProfile} from "../src/profile-factory.js";
import fs from 'node:fs/promises'
import path from "node:path";
import {tmpdir} from "node:os";
import {loadAllProfiles, saveProfiles} from "../src/profiles-file.js";
/** @typedef {import('../src/models.js').Profile} Profile */

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

    /** @type Profile[] */
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
    expect(savedProfiles).toHaveLength(1)
    const savedProfile = savedProfiles[0]
    expect(savedProfile.label).toBe('github-main')
    expect(savedProfile.service).toBe('github-main')
    expect(savedProfile.counter).toBe(0)
    expect(savedProfile.require.length).toBe(4)
    expect(savedProfile.length).toBe(20)
    expect(stdout.write).toHaveBeenCalledWith("Created profile: 'github-main'\n")
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

    /** @type Profile[] */
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
    const savedProfile = savedProfiles[0]
    expect(savedProfile.updatedAt).not.toBe(profile.updatedAt)
  })

  it('fails to bump if profile does not exist', async () => {
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
    expect(stdout.write).toHaveBeenCalledWith('label  counter\n')
  })

  it('creates a profile when the profiles file does not exist', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'dpg-'))
    const profilesPath = path.join(dir, 'profiles.json')

    const stdout = { write: vi.fn() }
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ create: 'github-main' }),
      {
        loadAllProfiles: () => loadAllProfiles({ profilesPath }),
        saveProfiles: profiles => saveProfiles(profiles, { profilesPath }),
        stdout,
        stderr
      }
    )

    expect(exitCode).toBe(0)
    expect(stdout.write).toHaveBeenCalledWith("Created profile: 'github-main'\n")
    expect(stderr.write).not.toHaveBeenCalled()

    const saved = JSON.parse(await fs.readFile(profilesPath, 'utf8'))
    expect(saved).toHaveLength(1)
    expect(saved[0].label).toBe('github-main')
    expect(saved[0].counter).toBe(0)
  })

  it('deletes an existing profile after confirmation', async () => {
    const profiles = [
      makeProfile({ label: 'github-main' }),
      makeProfile({ label: 'gitlab-main', service: 'gitlab.com' })
    ]

    /** @type Profile[] */
    let savedProfiles = null

    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ deleteLabel: 'github-main' }),
      {
        loadAllProfiles: async () => profiles,
        saveProfiles: async p => { savedProfiles = p },
        promptForConfirmation: async () => 'y',
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(savedProfiles).not.toBeNull()

    if (!savedProfiles) throw new Error('not saved')

    expect(savedProfiles).toHaveLength(1)
    expect(savedProfiles[0].label).toBe('gitlab-main')
    expect(stdout.write).toHaveBeenCalledWith("Deleted profile: 'github-main'\n")
  })

  it('cancels deletion on default response', async () => {
    const profiles = [makeProfile({ label: 'github-main' })]
    let saveCalled = false
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ deleteLabel: 'github-main' }),
      {
        loadAllProfiles: async () => profiles,
        saveProfiles: async () => { saveCalled = true },
        promptForConfirmation: async () => '',
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(saveCalled).toBe(false)
    expect(stdout.write).toHaveBeenCalledWith('Cancelled\n')
  })

  it('cancels deletion on non-y response', async () => {
    const profiles = [makeProfile({ label: 'github-main' })]
    let saveCalled = false
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ deleteLabel: 'github-main' }),
      {
        loadAllProfiles: async () => profiles,
        saveProfiles: async () => { saveCalled = true },
        promptForConfirmation: async () => 'n',
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(saveCalled).toBe(false)
    expect(stdout.write).toHaveBeenCalledWith('Cancelled\n')
  })

  it('fails when deleting a non-existent profile', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ deleteLabel: 'missing' }),
      {
        loadAllProfiles: async () => [makeProfile({ label: 'github-main' })],
        promptForConfirmation: async () => 'y',
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/does not exist/i))
  })

  it('does not report deletion if save fails after confirmation', async () => {
    const profiles = [
      makeProfile({ label: 'github-main' }),
      makeProfile({ label: 'gitlab-main', service: 'gitlab.com' })
    ]

    const stdout = { write: vi.fn() }
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ deleteLabel: 'github-main' }),
      {
        loadAllProfiles: async () => profiles,
        saveProfiles: async () => {
          throw new Error('disk full')
        },
        promptForConfirmation: async () => 'y',
        stdout,
        stderr
      }
    )

    expect(exitCode).toBe(1)

    const out = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(out).not.toMatch(/Deleted profile/i)

    expect(stderr.write).toHaveBeenCalledWith(
      expect.stringMatching(/disk full/i)
    )
  })

  it('shows an existing profile as pretty-printed JSON', async () => {
    const profile = makeProfile({ label: 'github-main', service: 'github.com' })
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ showProfileLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => profile,
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    const parsed = JSON.parse(output)

    expect(parsed.label).toBe('github-main')
    expect(parsed.service).toBe('github.com')
    expect(output).toContain('\n')
  })

  it('fails when --show-profile target does not exist', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ showProfileLabel: 'nope' }),
      {
        loadProfileByLabel: async () => {
          throw new Error("Profile 'nope' does not exist")
        },
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/does not exist/i))
    expect(exitCode).toBe(1)
  })

  it('fails if multiple primary commands are used', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({
        create: 'a',
        deleteLabel: 'b',
        bump: 'c'
      }),
      { stdout: { write: vi.fn() }, stderr }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(
      expect.stringMatching(/conflicting commands/i)
    )
  })

  it('fails if --show is used without a valid command', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ deleteLabel: 'missing', show: true }),
      { stdout: { write: vi.fn() }, stderr }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/show/i))
  })

  it('fails if --save is used without --bump', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ profileLabel: 'missing', save: true }),
      { stdout: { write: vi.fn() }, stderr }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/save/i))
  })

  it('fails if --save is used with --profile', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ profileLabel: 'x', save: true }),
      { stdout: { write: vi.fn() }, stderr }
    )

    expect(exitCode).toBe(1)
  })

  it('fails if --show is used with --list', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ list: true, show: true }),
      { stdout: { write: vi.fn() }, stderr }
    )

    expect(exitCode).toBe(1)
  })
})
