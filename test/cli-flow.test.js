import {describe, expect, it, vi} from 'vitest'
import {runCli} from '../src/cli-runner.js'
import {DEFAULT_PROFILE, makeProfile} from './fixtures/profiles.js'
import {makeCliArgs} from './fixtures/cli.js'
import {profilesRepositoryClassMock} from "./mocks/profiles-repository.js";

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

  it('shows an existing profile as pretty-printed JSON', async () => {
    const profile = makeProfile({label: 'github-main', service: 'github.com'})
    const stdout = {write: vi.fn()}

    const exitCode = await runCli(
      makeCliArgs({showProfileLabel: 'github-main'}),
      {
        ProfilesRepositoryClass: profilesRepositoryClassMock([profile]),
        stdout,
        stderr: {write: vi.fn()}
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
    const stderr = {write: vi.fn()}
    const repoMock = profilesRepositoryClassMock([])

    const exitCode = await runCli(
      makeCliArgs({showProfileLabel: 'nope'}),
      {
        ProfilesRepositoryClass: repoMock,
        stdout: {write: vi.fn()},
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

  it('fails if --show is used with --init', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ init: true, show: true }),
      { stdout: { write: vi.fn() }, stderr }
    )

    expect(exitCode).toBe(1)
  })

  it('fails if --config is used with --init', async () => {
    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ configPresent: true, init: true }),
      { stdout: { write: vi.fn() }, stderr }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/conflicting commands/i))
  })
})
