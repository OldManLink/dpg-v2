import { describe, it, expect, vi } from 'vitest'
import { runCli } from '../src/cli-runner.js'
import { makeProfile } from './fixtures/profiles.js'
import { makeCliArgs } from './fixtures/cli.js'

describe('list command', () => {
  it('prints all profiles in sorted order', async () => {
    const profiles = [
      makeProfile({ label: 'zeta', service: 'z.com' }),
      makeProfile({ label: 'alpha', service: 'a.com' })
    ]

    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ list: true }),
      {
        loadAllProfiles: async () => profiles,
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).toMatch(/alpha/)
    expect(output).toMatch(/zeta/)
    expect(output.indexOf('alpha')).toBeLessThan(output.indexOf('zeta'))
  })

  it('prints empty message if no profiles exist', async () => {
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
