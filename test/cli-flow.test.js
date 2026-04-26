import { describe, it, expect, vi } from 'vitest'
import { runCli } from '../src/cli-runner.js'
import {DEFAULT_PROFILE, makeProfile} from './fixtures/profiles.js'
import { makeCliArgs } from './fixtures/cli.js'
import {createDefaultProfile} from "../src/profile-factory.js";
import fs from 'node:fs/promises'
import path from "node:path";
import {tmpdir} from "node:os";
import {loadAllProfiles, saveProfiles} from "../src/profiles-file.js";
import { makeConfig } from './fixtures/config.js'
import {openInEditor} from "../src/editor.js";
import {profilesRepositoryClassMock} from "./mocks/profiles-repository.js";
/** @typedef {import('../src/models.js').Profile} Profile */
/** @typedef {import('../src/models.js').Config} Config */
/** @typedef {import('../src/models.js').EditorSpawn} EditorSpawn */
/** @typedef {import('node:child_process').ChildProcess} ChildProcess */

describe('runCli', () => {
  it('loads profile, prompts for password, generates, copies, and prints success', async () => {
    const repoMock = profilesRepositoryClassMock([DEFAULT_PROFILE])
    const promptForMasterPassword = vi.fn(async () => 'master')
    const generatePassword = vi.fn(async () => 'generated-secret')
    const copyToClipboard = vi.fn(async () => {})
    const stdout = { write: vi.fn() }
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ profileLabel: 'github-main', show: false, help: false }),
      {
        promptForMasterPassword,
        generatePassword,
        copyToClipboard,
        ProfilesRepositoryClass: repoMock,
        stdout,
        stderr
      }
    )

    expect(exitCode).toBe(0)
    expect(repoMock.load).toHaveBeenCalled()
    expect(promptForMasterPassword).toHaveBeenCalled()
    expect(generatePassword).toHaveBeenCalledWith('master', DEFAULT_PROFILE)
    expect(copyToClipboard).toHaveBeenCalledWith('generated-secret')
    expect(stdout.write).toHaveBeenCalledWith(expect.stringMatching(/copied to clipboard/i))
  })

  it('prints password when --show is used', async () => {
    const stdout = { write: vi.fn() }
    const repoMock = profilesRepositoryClassMock([DEFAULT_PROFILE])

    const exitCode = await runCli(
      makeCliArgs({ profileLabel: 'github-main', show: true, help: false }),
      {
        ProfilesRepositoryClass: repoMock,
        promptForMasterPassword: async () => 'master',
        generatePassword: async () => 'generated-secret',
        copyToClipboard: async () => {},
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(repoMock.load).toHaveBeenCalled()
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
    const repoMock = profilesRepositoryClassMock([created])
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ list: true }),
      {
        ProfilesRepositoryClass: repoMock,
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(repoMock.load).toHaveBeenCalled()
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
    const repoMock = profilesRepositoryClassMock([DEFAULT_PROFILE])

    const exitCode = await runCli(
      makeCliArgs({ profileLabel: 'missing', show: false, help: false }),
      {
        ProfilesRepositoryClass: repoMock,
        promptForMasterPassword: async () => 'master',
        generatePassword: async () => 'generated-secret',
        copyToClipboard: async () => {},
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(repoMock.load).toHaveBeenCalled()
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
        ProfilesRepositoryClass: profilesRepositoryClassMock([]),
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
        ProfilesRepositoryClass: profilesRepositoryClassMock([profile]),
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
    const repoMock = profilesRepositoryClassMock([])

    const exitCode = await runCli(
      makeCliArgs({ showProfileLabel: 'nope' }),
      {
        ProfilesRepositoryClass: repoMock,
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(repoMock.load).toHaveBeenCalled()
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

  it('fails if --config is used with --list', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ configPresent: true, list: true }),
      { stdout: { write: vi.fn() }, stderr }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/conflicting commands/i))
  })

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
      timeout: 900,
      sortBy: 'label',
      editor: ''
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
      timeout: 900,
      sortBy: 'label',
      editor: ''
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
      timeout: 0,
      sortBy: 'label',
      editor: ''
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

  it('updates a profile after valid edit and confirmation', async () => {
    const original = makeProfile({
      label: 'github-main',
      service: 'github.com',
      account: 'peter@example.com',
      counter: 4,
      length: 20,
      require: ['lower', 'upper', 'digit', 'symbol'],
      symbolSet: '@!#'
    })

    /** @type {Profile[] | null} */
    let savedProfiles = null

    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => original,
        loadAllProfiles: async () => [original],
        saveProfiles: async profiles => { savedProfiles = profiles },
        writeTempFile: async () => '/tmp/github-main_1776883800.json',
        openInEditor: async () => 0,
        readTempFile: async () => JSON.stringify({
          service: 'github-enterprise.example.com',
          account: 'peter@example.com',
          counter: 4,
          length: 20,
          require: ['lower', 'upper', 'digit', 'symbol'],
          symbolSet: '@!#'
        }, null, 2),
        deleteTempFile: async () => {},
        promptForConfirmation: async () => 'y',
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(savedProfiles).not.toBeNull()
    if (!savedProfiles) throw new Error('not saved')

    const updated = savedProfiles[0]
    expect(updated.createdAt).toBe(original.createdAt)
    expect(updated.updatedAt).not.toBe(original.updatedAt)
    expect(updated.service).toBe('github-enterprise.example.com')

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).toMatch(/changed fields: service/i)
    expect(output).toMatch(/will affect the generated password/i)
    expect(output).toMatch(/Updated profile 'github-main'/)
  })

  it('prints no changes made when edited content is unchanged', async () => {
    const original = makeProfile({
      label: 'github-main'
    })

    let saveCalled = false
    let confirmCalled = false
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => original,
        loadAllProfiles: async () => [original],
        saveProfiles: async () => { saveCalled = true },
        writeTempFile: async () => '/tmp/github-main_1776883800.json',
        openInEditor: async () => 0,
        readTempFile: async () => JSON.stringify({
          service: original.service,
          account: original.account,
          counter: original.counter,
          length: original.length,
          require: original.require,
          symbolSet: original.symbolSet
        }, null, 2),
        deleteTempFile: async () => {},
        promptForConfirmation: async () => {
          confirmCalled = true
          return 'y'
        },
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(saveCalled).toBe(false)
    expect(confirmCalled).toBe(false)
    expect(stdout.write).toHaveBeenCalledWith('No changes made\n')
  })

  it('fails and does not persist on invalid JSON', async () => {
    const original = makeProfile({
      label: 'github-main'
    })

    let saveCalled = false
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => original,
        loadAllProfiles: async () => [original],
        saveProfiles: async () => { saveCalled = true },
        writeTempFile: async () => '/tmp/github-main_1776883800.json',
        openInEditor: async () => 0,
        readTempFile: async () => '{ invalid json',
        deleteTempFile: async () => {},
        promptForConfirmation: async () => 'y',
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(saveCalled).toBe(false)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/invalid json/i))
  })

  it('fails and does not persist on validation failure', async () => {
    const original = makeProfile({
      label: 'github-main'
    })

    let saveCalled = false
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => original,
        loadAllProfiles: async () => [original],
        saveProfiles: async () => { saveCalled = true },
        writeTempFile: async () => '/tmp/github-main_1776883800.json',
        openInEditor: async () => 0,
        readTempFile: async () => JSON.stringify({
          service: 'github.com',
          account: 'peter@example.com',
          counter: 4,
          length: -1,
          require: ['lower', 'upper'],
          symbolSet: '@!#'
        }, null, 2),
        deleteTempFile: async () => {},
        promptForConfirmation: async () => 'y',
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(saveCalled).toBe(false)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/length/i))
  })

  it('fails for non-existent profile', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'missing' }),
      {
        loadProfileByLabel: async () => {
          throw new Error("Profile 'missing' does not exist")
        },
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/does not exist/i))
  })

  it('does not persist if editor exits non-zero', async () => {
    const original = makeProfile({
      label: 'github-main'
    })

    let saveCalled = false
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => original,
        loadAllProfiles: async () => [original],
        saveProfiles: async () => { saveCalled = true },
        writeTempFile: async () => '/tmp/github-main_1776883800.json',
        openInEditor: async () => 1,
        deleteTempFile: async () => {},
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(1)
    expect(saveCalled).toBe(false)

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).not.toMatch(/Updated profile/i)
  })

  it('does not persist when confirmation is declined', async () => {
    const original = makeProfile({
      label: 'github-main',
      service: 'github.com'
    })

    let saveCalled = false
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => original,
        loadAllProfiles: async () => [original],
        saveProfiles: async () => { saveCalled = true },
        writeTempFile: async () => '/tmp/github-main_1776883800.json',
        openInEditor: async () => 0,
        readTempFile: async () => JSON.stringify({
          service: 'gitlab.com',
          account: original.account,
          counter: original.counter,
          length: original.length,
          require: original.require,
          symbolSet: original.symbolSet
        }, null, 2),
        deleteTempFile: async () => {},
        promptForConfirmation: async () => 'n',
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(saveCalled).toBe(false)

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).toMatch(/changed fields: service/i)
    expect(output).toMatch(/No changes saved/i)
  })

  it('uses editor from config when set', async () => {
    const original = makeProfile({ label: 'github-main' })

    let usedEditor = null

    await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => original,
        loadAllProfiles: async () => [original],
        loadConfig: async () => ({ editor: 'emacs' }),

        writeTempFile: async () => '/tmp/file.json',
        openInEditor: async (editor) => {
          usedEditor = editor
          return 1 // force early exit
        },
        deleteTempFile: async () => {},

        stdout: { write: vi.fn() },
        stderr: { write: vi.fn() }
      }
    )

    expect(usedEditor).toBe('emacs')
  })

  it('uses $EDITOR when config editor is not set', async () => {
    const original = makeProfile({ label: 'github-main' })

    let usedEditor = null

    const prev = process.env.EDITOR
    process.env.EDITOR = 'nano'

    try {
      await runCli(
        makeCliArgs({ editLabel: 'github-main' }),
        {
          loadProfileByLabel: async () => original,
          loadAllProfiles: async () => [original],
          loadConfig: async () => ({}),

          writeTempFile: async () => '/tmp/file.json',
          openInEditor: async (editor) => {
            usedEditor = editor
            return 1
          },
          deleteTempFile: async () => {},

          stdout: { write: vi.fn() },
          stderr: { write: vi.fn() }
        }
      )
    } finally {
      process.env.EDITOR = prev
    }

    expect(usedEditor).toBe('nano')
  })

  it('falls back to default editor when config and $EDITOR are not set', async () => {
    const original = makeProfile({ label: 'github-main' })

    let usedEditor = null

    const prev = process.env.EDITOR
    delete process.env.EDITOR

    try {
      await runCli(
        makeCliArgs({ editLabel: 'github-main' }),
        {
          loadProfileByLabel: async () => original,
          loadAllProfiles: async () => [original],
          loadConfig: async () => ({}),

          writeTempFile: async () => '/tmp/file.json',
          openInEditor: async (editor) => {
            usedEditor = editor
            return 1
          },
          deleteTempFile: async () => {},

          stdout: { write: vi.fn() },
          stderr: { write: vi.fn() }
        }
      )
    } finally {
      process.env.EDITOR = prev
    }

    expect(usedEditor).toBe('vi')
  })

  it('cleans up the temp file after a successful edit', async () => {
    const original = makeProfile({
      label: 'github-main',
      service: 'github.com'
    })

    let deletedPath = null

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => original,
        loadAllProfiles: async () => [original],
        loadConfig: async () => makeConfig({ editor: 'vi' }),
        saveProfiles: async () => {},
        writeTempFile: async () => '/tmp/github-main_1776883800.json',
        openInEditor: async () => 0,
        readTempFile: async () => JSON.stringify({
          service: 'gitlab.com',
          account: original.account,
          counter: original.counter,
          length: original.length,
          require: original.require,
          symbolSet: original.symbolSet
        }, null, 2),
        deleteTempFile: async (filePath) => {
          deletedPath = filePath
        },
        promptForConfirmation: async () => 'y',
        stdout: { write: vi.fn() },
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(deletedPath).toBe('/tmp/github-main_1776883800.json')
  })

  it('cleans up the temp file when edited JSON is invalid', async () => {
    const original = makeProfile({ label: 'github-main' })

    let deletedPath = null

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => original,
        loadAllProfiles: async () => [original],
        loadConfig: async () => makeConfig({ editor: 'vi' }),
        saveProfiles: async () => {},
        writeTempFile: async () => '/tmp/github-main_1776883800.json',
        openInEditor: async () => 0,
        readTempFile: async () => '{ invalid json',
        deleteTempFile: async (filePath) => {
          deletedPath = filePath
        },
        promptForConfirmation: async () => 'y',
        stdout: { write: vi.fn() },
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(1)
    expect(deletedPath).toBe('/tmp/github-main_1776883800.json')
  })

  it('fails and does not persist when require contains unknown values', async () => {
    const original = makeProfile({ label: 'github-main' })

    let saveCalled = false
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => original,
        loadAllProfiles: async () => [original],
        loadConfig: async () => makeConfig({ editor: 'vi' }),
        saveProfiles: async () => { saveCalled = true },
        writeTempFile: async () => '/tmp/file.json',
        openInEditor: async () => 0,
        readTempFile: async () => JSON.stringify({
          service: 'github.com',
          account: original.account,
          counter: original.counter,
          length: original.length,
          require: ['runes', 'upper'],
          symbolSet: original.symbolSet
        }, null, 2),
        deleteTempFile: async () => {},
        promptForConfirmation: async () => 'y',
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(saveCalled).toBe(false)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/Unknown character class/i))
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
      timeout: 0,
      sortBy: 'label',
      editor: 'nano'
    })
    expect(stdout.write).toHaveBeenCalledWith('Updated config: editor=nano\n')
  })

  it('uses editor command with arguments from config', async () => {
    const original = makeProfile({ label: 'github-main' })
    let usedEditor = null

    await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        loadProfileByLabel: async () => original,
        loadAllProfiles: async () => [original],
        loadConfig: async () => makeConfig({ editor: 'code --wait' }),
        writeTempFile: async () => '/tmp/file.json',
        openInEditor: async (editor) => {
          usedEditor = editor
          return 1
        },
        deleteTempFile: async () => {},
        stdout: { write: vi.fn() },
        stderr: { write: vi.fn() }
      }
    )

    expect(usedEditor).toBe('code --wait')
  })

  it('splits editor command and appends file path', async () => {
    let spawnedCommand = null
    let spawnedArgs = null

    const fakeSpawn =
      /** @type {EditorSpawn} */ (
      /** @type {unknown} */ (
        /**
         * @param {string} command
         * @param {readonly string[]} args
         * @param {object=} _options
         * @returns {ChildProcess}
         */
          (command, args, _options) => {
          spawnedCommand = command
          spawnedArgs = [...args]

          return /** @type {ChildProcess} */ ({
            on: (
              /** @type {'error' | 'close'} */ event,
              /** @type {(value: any) => void} */ handler
            ) => {
              if (event === 'close') handler(0)
            }
          })
        }
      )
    )

    await openInEditor('code --wait', '/tmp/file.json', fakeSpawn)

    expect(spawnedCommand).toBe('code')
    expect(spawnedArgs).toEqual(['--wait', '/tmp/file.json'])
  })

  it('supports quoted editor paths', async () => {
    let spawnedCommand = null
    let spawnedArgs = null

    const fakeSpawn =
      /** @type {EditorSpawn} */ (
      /** @type {unknown} */ (
        /**
         * @param {string} command
         * @param {readonly string[]} args
         * @param {object=} _options
         * @returns {ChildProcess}
         */
          (command, args, _options) => {
          spawnedCommand = command
          spawnedArgs = [...args]

          return /** @type {ChildProcess} */ ({
            on: (
              /** @type {'error' | 'close'} */ event,
              /** @type {(value: any) => void} */ handler
            ) => {
              if (event === 'close') handler(0)
            }
          })
        }
      )
    )

    await openInEditor('"C:\\Program Files\\Editor\\editor.exe" --wait', 'C:\\tmp\\file.json', fakeSpawn)
    expect(spawnedCommand).toBe('C:\\Program Files\\Editor\\editor.exe')
    expect(spawnedArgs).toEqual(['--wait', 'C:\\tmp\\file.json'])
  })
})
