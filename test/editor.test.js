import {describe, it, expect, vi} from 'vitest'
import {openInEditor, splitCommand} from '../src/editor.js'
import {runCli} from "../src/cli-runner.js";
import {makeCliArgs} from "./fixtures/cli.js";
import {DEFAULT_PROFILE, makeProfile} from "./fixtures/profiles.js";
import {profilesRepositoryClassMock} from "./mocks/profiles-repository.js";
import {makeConfig} from "./fixtures/config.js";
/** @typedef {import('../src/models.js').EditorSpawn} EditorSpawn */
/** @typedef {import('node:child_process').ChildProcess} ChildProcess */

describe('edit command', () => {
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

    const stdout = { write: vi.fn() }
    const repoMock = profilesRepositoryClassMock([original])

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
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
    expect(repoMock.repo.replace).toHaveBeenCalled()
    const updated = repoMock.repo.replace.mock.calls[0][0]

    expect(updated.createdAt).toBe(original.createdAt)
    expect(updated.updatedAt).not.toBe(original.updatedAt)
    expect(updated.service).toBe('github-enterprise.example.com')
    expect(repoMock.repo.persist).toHaveBeenCalled()

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).toMatch(/changed fields: service/i)
    expect(output).toMatch(/will affect the generated password/i)
    expect(output).toMatch(/Updated profile 'github-main'/)
  })

  it('updates a profile after removing "symbol" and symbolSet', async () => {
    const original = makeProfile({
      label: 'github-main',
      service: 'github.com',
      account: 'peter@example.com',
      counter: 4,
      length: 20,
      require: ['lower', 'upper', 'digit', 'symbol'],
      symbolSet: '@!#'
    })

    const stdout = { write: vi.fn() }
    const repoMock = profilesRepositoryClassMock([original])

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
        writeTempFile: async () => '/tmp/github-main_1776883800.json',
        openInEditor: async () => 0,
        readTempFile: async () => JSON.stringify({
          service: 'github-enterprise.example.com',
          account: 'peter@example.com',
          counter: 4,
          length: 20,
          require: ['lower', 'upper', 'digit']
        }, null, 2),
        deleteTempFile: async () => {},
        promptForConfirmation: async () => 'y',
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(0)
    expect(repoMock.repo.replace).toHaveBeenCalled()
    const updated = repoMock.repo.replace.mock.calls[0][0]

    expect(updated.createdAt).toBe(original.createdAt)
    expect(updated.updatedAt).not.toBe(original.updatedAt)
    expect(updated.service).toBe('github-enterprise.example.com')
    expect(repoMock.repo.persist).toHaveBeenCalled()

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).toMatch(/changed fields: service/i)
    expect(output).toMatch(/will affect the generated password/i)
    expect(output).toMatch(/Updated profile 'github-main'/)
  })

  it('prints no changes made when edited content is unchanged', async () => {
    const original = makeProfile({label: 'github-main'})
    const repoMock = profilesRepositoryClassMock([original])

    let confirmCalled = false
    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
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
    expect(repoMock.repo.replace).not.toHaveBeenCalled()
    expect(repoMock.repo.persist).not.toHaveBeenCalled()
    expect(confirmCalled).toBe(false)
    expect(stdout.write).toHaveBeenCalledWith('No changes made\n')
  })

  it('fails and does not persist on invalid JSON', async () => {
    const original = makeProfile({label: 'github-main'})
    const repoMock = profilesRepositoryClassMock([original])

    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
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
    expect(repoMock.repo.replace).not.toHaveBeenCalled()
    expect(repoMock.repo.persist).not.toHaveBeenCalled()
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/invalid json/i))
  })

  it('fails and does not persist on validation failure', async () => {
    const original = makeProfile({label: 'github-main'})
    const repoMock = profilesRepositoryClassMock([original])

    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
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
    expect(repoMock.repo.replace).not.toHaveBeenCalled()
    expect(repoMock.repo.persist).not.toHaveBeenCalled()
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/length/i))
  })

  it('fails for non-existent profile', async () => {
    const stderr = { write: vi.fn() }
    const repoMock = profilesRepositoryClassMock([DEFAULT_PROFILE])

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'missing' }),
      {
        ProfilesRepositoryClass: repoMock,
        stdout: { write: vi.fn() },
        stderr
      }
    )

    expect(exitCode).toBe(1)
    expect(repoMock.repo.replace).not.toHaveBeenCalled()
    expect(repoMock.repo.persist).not.toHaveBeenCalled()
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/Profile not found/i))
  })

  it('does not persist if editor exits non-zero', async () => {
    const original = makeProfile({label: 'github-main'})
    const repoMock = profilesRepositoryClassMock([original])

    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
        writeTempFile: async () => '/tmp/github-main_1776883800.json',
        openInEditor: async () => 1,
        deleteTempFile: async () => {},
        stdout,
        stderr: { write: vi.fn() }
      }
    )

    expect(exitCode).toBe(1)
    expect(repoMock.repo.replace).not.toHaveBeenCalled()
    expect(repoMock.repo.persist).not.toHaveBeenCalled()

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).not.toMatch(/Updated profile/i)
  })

  it('does not persist when confirmation is declined', async () => {
    const original = makeProfile({label: 'github-main', service: 'github.com'})
    const repoMock = profilesRepositoryClassMock([original])

    const stdout = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
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
    expect(repoMock.repo.replace).not.toHaveBeenCalled()
    expect(repoMock.repo.persist).not.toHaveBeenCalled()

    const output = stdout.write.mock.calls.map(c => c[0]).join('')
    expect(output).toMatch(/changed fields: service/i)
    expect(output).toMatch(/No changes saved/i)
  })

  it('uses editor from config when set', async () => {
    const original = makeProfile({ label: 'github-main' })
    const repoMock = profilesRepositoryClassMock([original])

    let usedEditor = null

    await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
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
    const repoMock = profilesRepositoryClassMock([original])

    let usedEditor = null

    const prev = process.env.EDITOR
    process.env.EDITOR = 'nano'

    try {
      await runCli(
        makeCliArgs({ editLabel: 'github-main' }),
        {
          ProfilesRepositoryClass: repoMock,
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
    const repoMock = profilesRepositoryClassMock([original])

    let usedEditor = null

    const prev = process.env.EDITOR
    delete process.env.EDITOR

    try {
      await runCli(
        makeCliArgs({ editLabel: 'github-main' }),
        {
          ProfilesRepositoryClass: repoMock,
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
    const original = makeProfile({label: 'github-main', service: 'github.com'})
    const repoMock = profilesRepositoryClassMock([original])

    let deletedPath = null

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
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
    const repoMock = profilesRepositoryClassMock([original])

    let deletedPath = null

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
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
    const repoMock = profilesRepositoryClassMock([original])

    const stderr = { write: vi.fn() }

    const exitCode = await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
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
    expect(repoMock.repo.replace).not.toHaveBeenCalled()
    expect(repoMock.repo.persist).not.toHaveBeenCalled()
    expect(stderr.write).toHaveBeenCalledWith(expect.stringMatching(/Unknown character class/i))
  })
  it('uses editor command with arguments from config', async () => {
    const original = makeProfile({ label: 'github-main' })
    const repoMock = profilesRepositoryClassMock([original])

    let usedEditor = null

    await runCli(
      makeCliArgs({ editLabel: 'github-main' }),
      {
        ProfilesRepositoryClass: repoMock,
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

describe('splitCommand', () => {
  it('splits command with arguments', () => {
    expect(splitCommand('code --wait')).toEqual(['code', '--wait'])
  })

  it('keeps quoted executable path together', () => {
    expect(splitCommand('"C:\\Program Files\\Editor\\editor.exe" --wait')).toEqual([
      'C:\\Program Files\\Editor\\editor.exe',
      '--wait'
    ])
  })
})
