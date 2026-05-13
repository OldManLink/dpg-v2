import { describe, expect, it, vi } from 'vitest'
import { runCli } from '../src/cli-runner.js'
import { makeCliArgs } from './fixtures/cli.js'

describe('runCli --init', () => {
  it('prints created messages when both files are created', async () => {
    const stdout = { write: vi.fn() }
    const stderr = { write: vi.fn() }

    const initializeStorage = vi.fn(async () => ({
      createdConfig: true,
      updatedConfig: false,
      createdProfiles: true
    }))

    const exitCode = await runCli(
      makeCliArgs({ init: true }),
      { initializeStorage, stdout, stderr }
    )

    expect(exitCode).toBe(0)
    expect(initializeStorage).toHaveBeenCalled()
    expect(stdout.write).toHaveBeenCalledWith(
      'Created config.json\nCreated profiles.json\n'
    )
    expect(stderr.write).not.toHaveBeenCalled()
  })

  it('prints nothing-to-initialize when no changes are needed', async () => {
    const stdout = { write: vi.fn() }
    const stderr = { write: vi.fn() }

    const initializeStorage = vi.fn(async () => ({
      createdConfig: false,
      updatedConfig: false,
      createdProfiles: false
    }))

    const exitCode = await runCli(
      makeCliArgs({ init: true }),
      { initializeStorage, stdout, stderr }
    )

    expect(exitCode).toBe(0)
    expect(stdout.write).toHaveBeenCalledWith('Nothing to initialize\n')
    expect(stderr.write).not.toHaveBeenCalled()
  })

  it('prints updated config message when defaults are added', async () => {
    const stdout = { write: vi.fn() }
    const stderr = { write: vi.fn() }

    const initializeStorage = vi.fn(async () => ({
      createdConfig: false,
      updatedConfig: true,
      createdProfiles: false
    }))

    const exitCode = await runCli(
      makeCliArgs({ init: true }),
      { initializeStorage, stdout, stderr }
    )

    expect(exitCode).toBe(0)
    expect(stdout.write).toHaveBeenCalledWith('Updated config.json\n')
    expect(stderr.write).not.toHaveBeenCalled()
  })

  it('prints only actions that were performed', async () => {
    const stdout = { write: vi.fn() }
    const stderr = { write: vi.fn() }

    const initializeStorage = vi.fn(async () => ({
      createdConfig: false,
      updatedConfig: true,
      createdProfiles: true
    }))

    const exitCode = await runCli(
      makeCliArgs({ init: true }),
      { initializeStorage, stdout, stderr }
    )

    expect(exitCode).toBe(0)
    expect(stdout.write).toHaveBeenCalledWith(
      'Updated config.json\nCreated profiles.json\n'
    )
    expect(stderr.write).not.toHaveBeenCalled()
  })

  it('returns failure when initialization fails', async () => {
    const stdout = { write: vi.fn() }
    const stderr = { write: vi.fn() }

    const initializeStorage = vi.fn(async () => {
      throw new Error('permission denied')
    })

    const exitCode = await runCli(
      makeCliArgs({ init: true }),
      { initializeStorage, stdout, stderr }
    )

    expect(exitCode).toBe(1)
    expect(stdout.write).not.toHaveBeenCalled()
    expect(stderr.write).toHaveBeenCalledWith('permission denied\n')
  })
})
