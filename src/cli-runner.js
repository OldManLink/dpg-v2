import {loadProfileByLabel} from './profiles-file.js'
import {promptForMasterPassword} from './prompt.js'
import {generatePassword} from './generate.js'
import {copyToClipboard} from './clipboard.js'
import {usageText} from './cli-args.js'

/**
 * @param {{ profileLabel: string | null, show: boolean, help: boolean }} args
 * @param {object=} deps
 * @returns {Promise<number>}
 */
export async function runCli(args, deps = {}) {
  const {
    loadProfileByLabel: load = loadProfileByLabel,
    promptForMasterPassword: prompt = promptForMasterPassword,
    generatePassword: generate = generatePassword,
    copyToClipboard: copy = copyToClipboard,
    stdout = process.stdout,
    stderr = process.stderr
  } = deps

  if (args.help) {
    stdout.write(usageText() + '\n')
    return 0
  }

  if (!args.profileLabel) {
    stderr.write('A profile label is required. Use -p <label>.\n')
    return 1
  }

  try {
    const profile = await load(args.profileLabel)
    const masterPassword = await prompt()
    const password = await generate(masterPassword, profile)

    await copy(password)

    stdout.write(`Loaded profile: ${profile.label}\n`)
    stdout.write('Password copied to clipboard.\n')

    if (args.show) {
      stdout.write(password + '\n')
    }

    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    stderr.write(message + '\n')
    return 1
  }
}
