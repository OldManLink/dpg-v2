import { describe, it, expect, vi } from 'vitest'
import { runCli } from '../src/cli-runner.js'
import { makeProfile } from './fixtures/profiles.js'
import { makeCliArgs } from './fixtures/cli.js'

describe('bump command', () => {
  it('bumps counter in memory and generates password', async () => {
    const profile = makeProfile({ label: 'github', counter: 5 })

    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ bump: 'github', show: false, save: false }),
      {
        loadProfileByLabel: async () => profile,
        generatePassword: async () => 'pw',
        copyToClipboard: async () => {},
        promptForMasterPassword: async () => 'master',
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).toMatch(/5/)
    expect(output).toMatch(/6/)
  })

  it('persists counter when --save is used', async () => {
    const profile = makeProfile({ label: 'github', counter: 5 })

    let savedProfiles = null

    const exitCode = await runCli(
      makeCliArgs({ bump: 'github', show: false, save: true }),
      {
        loadProfileByLabel: async label => {
          if (label === 'github') return profile
          throw new Error(`Profile not found: ${label}`)
        },
        loadAllProfiles: async () => [profile],
        saveProfiles: async profiles => {
          savedProfiles = profiles
        },
        generatePassword: async () => 'pw',
        copyToClipboard: async () => {},
        promptForMasterPassword: async () => 'master',
        stdout: { write: () => {} },
        stderr: { write: () => {} }
      }
    )

    expect(exitCode).toBe(0)
    expect(savedProfiles).not.toBeNull()
    const result = savedProfiles
    expect(result[0].counter).toBe(6)
  })
})
