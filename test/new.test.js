import {describe, expect, it, vi} from "vitest";
import {runCli} from "../src/cli-runner.js";
import {makeCliArgs} from "./fixtures/cli.js";
import {profilesRepositoryClassMock} from "./mocks/profiles-repository.js";
import {DEFAULT_PROFILE} from "./fixtures/profiles.js";

describe('new command', () => {
  it('creates a new profile', async () => {
    const repoMock = profilesRepositoryClassMock([])
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ create: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)

    expect(repoMock.repo.create).toHaveBeenCalled()
    expect(repoMock.repo.persist).toHaveBeenCalled()
    const savedProfile = repoMock.repo.get('github-main')
    expect(savedProfile).not.toBeNull()
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
        ProfilesRepositoryClass: profilesRepositoryClassMock([DEFAULT_PROFILE]),
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/already exists/i))
  })
})
