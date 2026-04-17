import { loadProfileByLabel, saveProfiles, loadAllProfiles } from './profiles-file.js'
import { createDefaultProfile } from './profile-factory.js'
import { promptForMasterPassword } from './prompt.js'
import { generatePassword } from './generate.js'
import { copyToClipboard } from './clipboard.js'
import { usageText } from './cli-args.js'
import { promptForConfirmation } from './confirm.js'
import { serializeProfilePretty } from './profile-serialization.js'

/**
 * @typedef {{
 *   loadProfileByLabel?: (label: string) => Promise<any>,
 *   loadAllProfiles?: () => Promise<any[]>,
 *   saveProfiles?: (profiles: any[]) => Promise<void>,
 *   promptForMasterPassword?: () => Promise<string>,
 *   generatePassword?: (master: string, profile: any) => Promise<string>,
 *   copyToClipboard?: (text: string) => Promise<void>,
 *   promptForConfirmation?: (prompt: string) => Promise<string>,
 *   stdout?: { write: (s: string) => void },
 *   stderr?: { write: (s: string) => void }
 * }} CliDeps
 */

/**
 * @param {import('./cli-args.js').CliArgs} args
 * @param {CliDeps=} deps
 * @returns {Promise<number>}
 */
export async function runCli(args, deps = {}) {
  const {
    loadProfileByLabel: load = loadProfileByLabel,
    loadAllProfiles: loadAll = loadAllProfiles,
    saveProfiles: save = saveProfiles,
    promptForMasterPassword: prompt = promptForMasterPassword,
    generatePassword: generate = generatePassword,
    copyToClipboard: copy = copyToClipboard,
    promptForConfirmation: confirm = promptForConfirmation,
    stdout = process.stdout,
    stderr = process.stderr
  } = deps

  if (args.help) {
    stdout.write(usageText() + '\n')
    return 0
  }

  if (!args.profileLabel && !args.bump && !args.list && !args.create && !args.deleteLabel && !args.showProfileLabel) {
    stderr.write('No command specified. Use -p <label>, -b <label>, --list, -n <label>, -D <label>, or --show-profile <label>. See -h for help.\n')
    return 1
  }

  try {
    if (args.list) {
      const profiles = await loadAll()

      if (profiles.length === 0) {
        stdout.write('No profiles found.\n')
        return 0
      }

      const sorted = [...profiles].sort((a, b) =>
        a.label.localeCompare(b.label)
      )

      for (const p of sorted) {
        stdout.write(`${p.label} (${p.service}) [counter=${p.counter}]\n`)
      }

      return 0
    }

    if (args.bump) {
      const profile = await load(args.bump)

      const oldCounter = profile.counter
      const newCounter = oldCounter + 1

      const updatedProfile = {
        ...profile,
        counter: newCounter
      }

      const masterPassword = await prompt()
      const password = await generate(masterPassword, updatedProfile)

      await copy(password)

      if (args.show) {
        stdout.write(password + '\n')
      }

      if (args.save) {
        const now = new Date().toISOString()

        const updatedProfile = {
          ...profile,
          counter: newCounter,
          updatedAt: now
        }

        const all = await loadAll()
        const updated = all.map(p =>
          p.label === profile.label ? updatedProfile : p
        )

        await save(updated)

        stdout.write(`Counter: ${oldCounter} → ${newCounter} (saved)\n`)
      } else {
        stdout.write(`Counter: ${oldCounter} → ${newCounter}\n`)
      }

      return 0
    }

    if (args.create) {
      const all = await loadAll()

      if (all.some(p => p.label === args.create)) {
        stderr.write(`Profile already exists: '${args.create}'\n`)
        return 1
      }

      const profile = createDefaultProfile(args.create)
      await save([...all, profile])

      stdout.write(`Created profile: '${args.create}'\n`)
      return 0
    }

    if (args.deleteLabel) {
      const all = await loadAll()
      const existing = all.find(p => p.label === args.deleteLabel)

      if (!existing) {
        stderr.write(`Profile does not exist: '${args.deleteLabel}'\n`)
        return 1
      }

      const answer = await confirm(
        `Delete profile '${args.deleteLabel}'? This cannot be undone. (y/N) `
      )

      if (answer !== 'y') {
        stdout.write('Cancelled\n')
        return 0
      }

      const remaining = all.filter(p => p.label !== args.deleteLabel)
      await save(remaining)

      stdout.write(`Deleted profile: '${args.deleteLabel}'\n`)
      return 0
    }

    if (args.showProfileLabel) {
      const profile = await load(args.showProfileLabel)
      stdout.write(serializeProfilePretty(profile) + '\n')
      return 0
    }

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
