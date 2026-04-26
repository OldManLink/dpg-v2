import {describe, expect, it, vi} from "vitest";
import {makeProfile} from "./fixtures/profiles.js";
import {runCli} from "../src/cli-runner.js";
import {makeCliArgs} from "./fixtures/cli.js";
import {profilesRepositoryClassMock} from "./mocks/profiles-repository.js";

describe('delete command', () => {
  it('deletes an existing profile after confirmation', async () => {
    const profiles = [
      makeProfile({ label: 'github-main' }),
      makeProfile({ label: 'gitlab-main', service: 'gitlab.com' })
    ]
    const repoMock = profilesRepositoryClassMock(profiles)

    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ deleteLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
        promptForConfirmation: async () => 'y',
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(repoMock.repo.delete).toHaveBeenCalledWith('github-main')
    expect(repoMock.repo.persist).toHaveBeenCalled()
    expect(repoMock.repo.list()).toHaveLength(1)
    expect(repoMock.repo.list()[0].label).toBe('gitlab-main')
    expect(stdout.write).toHaveBeenCalledWith("Deleted profile: 'github-main'\n")
  })

  it('cancels deletion on default response', async () => {
    const profiles = [makeProfile({label: 'github-main'})]
    const repoMock = profilesRepositoryClassMock(profiles)
    const stdout = {write: vi.fn()}

    const exitCode = await runCli(
      makeCliArgs({deleteLabel: 'github-main'}),
      {
        ProfilesRepositoryClass: repoMock,
        promptForConfirmation: async () => '',
        stdout,
        stderr: {write: vi.fn()}
      }
    )

    expect(exitCode).toBe(0)
    expect(repoMock.repo.list()).toHaveLength(1)
    expect(repoMock.repo.persist).not.toHaveBeenCalled()
    expect(stdout.write).toHaveBeenCalledWith('Cancelled\n')
  })

  it('cancels deletion on non-y response', async () => {
    const profiles = [makeProfile({label: 'github-main'})]
    const repoMock = profilesRepositoryClassMock(profiles)
    const stdout = {write: vi.fn()}

    const exitCode = await runCli(
      makeCliArgs({deleteLabel: 'github-main'}),
      {
        ProfilesRepositoryClass: repoMock,
        promptForConfirmation: async () => 'n',
        stdout,
        stderr: {write: vi.fn()}
      }
    )

    expect(exitCode).toBe(0)
    expect(repoMock.repo.list()).toHaveLength(1)
    expect(repoMock.repo.persist).not.toHaveBeenCalled()
    expect(stdout.write).toHaveBeenCalledWith('Cancelled\n')
  })

  it('fails when deleting a non-existent profile', async () => {
    const profiles = [makeProfile({label: 'github-main'})]
    const repoMock = profilesRepositoryClassMock(profiles)
    const stderr = {write: vi.fn()}

    const exitCode = await runCli(
      makeCliArgs({deleteLabel: 'missing'}),
      {
        ProfilesRepositoryClass: repoMock,
        promptForConfirmation: async () => 'y',
        stdout: {write: vi.fn()},
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(repoMock.repo.list()).toHaveLength(1)
    expect(repoMock.repo.persist).not.toHaveBeenCalled()
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/does not exist/i))
  })

  it('does not report deletion if save fails after confirmation', async () => {
    const profiles = [
      makeProfile({label: 'github-main'}),
      makeProfile({label: 'gitlab-main', service: 'gitlab.com'})
    ]
    const repoMock = profilesRepositoryClassMock(profiles, {
      persist: vi.fn(async () => {
        throw new Error('disk full')
      })
    })

    const stdout = {write: vi.fn()}
    const stderr = {write: vi.fn()}

    const exitCode = await runCli(
      makeCliArgs({deleteLabel: 'github-main'}),
      {
        ProfilesRepositoryClass: repoMock,
        promptForConfirmation: async () => 'y',
        stdout,
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(repoMock.repo.delete).toHaveBeenCalled()
    expect(repoMock.repo.persist).toHaveBeenCalled()
    expect(stdout.write).not.toHaveBeenCalledWith(expect.stringContaining('Deleted profile'))
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/disk full/i))
  })
})
