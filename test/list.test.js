import { describe, it, expect, vi } from 'vitest'
import { runCli } from '../src/cli-runner.js'
import { makeProfile } from './fixtures/profiles.js'
import { makeCliArgs } from './fixtures/cli.js'
import { profilesRepositoryClassMock } from './mocks/profiles-repository.js'
import {createDefaultProfile} from "../src/profile-factory.js";

describe('list command', () => {
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

  it('prints all profiles in sorted order', async () => {
    const profiles = [
      makeProfile({ label: 'zeta', service: 'z.com' }),
      makeProfile({ label: 'alpha', service: 'a.com' })
    ]

    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ list: true }),
      {
        ProfilesRepositoryClass: profilesRepositoryClassMock(profiles),
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).toMatch(/label {2}counter/)
    expect(output).toMatch(/alpha/)
    expect(output).toMatch(/zeta/)
    expect(output.indexOf('alpha')).toBeLessThan(output.indexOf('zeta'))
  })

  it('prints empty message if no profiles exist', async () => {
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
})
