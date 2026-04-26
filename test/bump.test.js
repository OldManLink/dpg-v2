import { describe, it, expect, vi } from 'vitest'
import { runCli } from '../src/cli-runner.js'
import { makeProfile } from './fixtures/profiles.js'
import { makeCliArgs } from './fixtures/cli.js'
import {profilesRepositoryClassMock} from "./mocks/profiles-repository.js";

describe('bump command', () => {
  it('bumps counter in memory and generates password', async () => {
    const profile = makeProfile({ label: 'github', counter: 5 })
    const repoMock = profilesRepositoryClassMock([profile])

    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ bump: 'github', show: false, save: false }),
      {
        ProfilesRepositoryClass: repoMock,
        generatePassword: async () => 'pw',
        copyToClipboard: async () => {},
        promptForMasterPassword: async () => 'master',
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(repoMock.repo.replace).not.toHaveBeenCalled()
    expect(repoMock.repo.persist).not.toHaveBeenCalled()

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).toMatch(/5/)
    expect(output).toMatch(/6/)
  })

  it('persists counter when --save is used', async () => {
    const profile = makeProfile({ label: 'github', counter: 5 })
    const repoMock = profilesRepositoryClassMock([profile])

    const exitCode = await runCli(
      makeCliArgs({ bump: 'github', show: false, save: true }),
      {
        ProfilesRepositoryClass: repoMock,
        generatePassword: async () => 'pw',
        copyToClipboard: async () => {},
        promptForMasterPassword: async () => 'master',
        stdout: { write: () => {} },
        stderr: { write: () => {} }
      }
    )

    expect(exitCode).toBe(0)
    expect(repoMock.repo.replace).toHaveBeenCalled()
    expect(repoMock.repo.persist).toHaveBeenCalled()
    const updatedProfile = repoMock.repo.replace.mock.calls[0][0]

    expect(updatedProfile.counter).toBe(6)
  })

  it('does not report saved if save fails', async () => {
    const profile = makeProfile({ label: 'github', counter: 5 })
    const repoMock = profilesRepositoryClassMock([profile], {
      persist: vi.fn(async () => {
        throw new Error('disk full')
      })
    })

    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ bump: 'github', save: true }),
      {
        ProfilesRepositoryClass: repoMock,
        generatePassword: async () => 'pw',
        copyToClipboard: async () => {},
        promptForMasterPassword: async () => 'master',
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(1)
    expect(repoMock.repo.replace).toHaveBeenCalled()
    expect(repoMock.repo.persist).toHaveBeenCalled()

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).not.toMatch(/\(saved\)/)
  })

  it('updates updatedAt when saved', async () => {
    const profile = makeProfile({
      label: 'github',
      counter: 5,
      updatedAt: '2020-01-01T00:00:00.000Z'
    })
    const repoMock = profilesRepositoryClassMock([profile])

    const exitCode = await runCli(
      makeCliArgs({ bump: 'github', save: true }),
      {
        ProfilesRepositoryClass: repoMock,
        generatePassword: async () => 'pw',
        copyToClipboard: async () => {},
        promptForMasterPassword: async () => 'master',
        stdout: { write: () => {} },
        stderr: { write: () => {} }
      }
    )

    expect(exitCode).toBe(0)

    expect(repoMock.repo.replace).toHaveBeenCalled()
    const updatedProfile = repoMock.repo.replace.mock.calls[0][0]

    expect(updatedProfile.counter).toBe(6)
    expect(updatedProfile.updatedAt).not.toBe(profile.updatedAt)
    expect(repoMock.repo.persist).toHaveBeenCalled()
  })

  it('fails to bump if profile does not exist', async () => {
    const stderr = { write: vi.fn() }
    const repoMock = profilesRepositoryClassMock([])

    const exitCode = await runCli(
      makeCliArgs({ bump: 'nope' }),
      {
        ProfilesRepositoryClass: repoMock,
        stderr,
        stdout: { write: () => {} }
      }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/does not exist/i))
    expect(repoMock.repo.replace).not.toHaveBeenCalled()
    expect(repoMock.repo.persist).not.toHaveBeenCalled()
  })
})
