import { loadProfileByLabel, saveProfiles, loadAllProfiles } from './profiles-file.js'
import { createDefaultProfile } from './profile-factory.js'
import { promptForMasterPassword } from './prompt.js'
import { generatePassword } from './generate.js'
import { copyToClipboard } from './clipboard.js'
import { usageText } from './cli-args.js'
import { promptForConfirmation } from './confirm.js'
import { serializeProfilePretty } from './profile-serialization.js'
import { formatProfileList } from './list-formatting.js'
import {loadConfig, saveConfig, parseConfigAssignment, applyConfigUpdate} from "./config-file.js";
/** @typedef {import('./models.js').CliDeps} CliDeps */
/** @typedef {import('./models.js').CliArgs} CliArgs */

/**
 * @param {CliArgs} args
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
    loadConfig: loadCfg = loadConfig,
    saveConfig: saveCfg = saveConfig,
    stdout = process.stdout,
    stderr = process.stderr
  } = deps

  if (args.help) {
    stdout.write(usageText() + '\n')
    return 0
  }

  try {
    checkForConflicts(args)

    if (args.list) {
      const profiles = await loadAll()
      const config = await loadCfg()
      stdout.write(formatProfileList(profiles, config.sortBy) + '\n')
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

    if (args.configPresent) {
      const config = await loadCfg()

      if (args.configArg === null) {
        stdout.write(JSON.stringify(config, null, 2) + '\n')
        return 0
      }

      const { key, value } = parseConfigAssignment(args.configArg)
      const updated = applyConfigUpdate(config, key, value)

      await saveCfg(updated)
      stdout.write(`Updated config: ${key}=${value}\n`)
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

/**
 * @param {CliArgs} args
 * @returns void
 */
function checkForConflicts(args) {
  const primary = []
  const usedTokens = []

  if (args.profileLabel) {
    primary.push('profile')
    usedTokens.push('-p')
  }

  if (args.list) {
    primary.push('list')
    usedTokens.push('-l')
  }

  if (args.bump) {
    primary.push('bump')
    usedTokens.push('-b')
  }

  if (args.create) {
    primary.push('create')
    usedTokens.push('-n')
  }

  if (args.deleteLabel) {
    primary.push('delete')
    usedTokens.push('-D')
  }

  if (args.showProfileLabel) {
    primary.push('show-profile')
    usedTokens.push('--show-profile')
  }

  if (args.configPresent) {
    primary.push('config')
    usedTokens.push('-c')
  }

  if (primary.length === 0) {
    throw new Error('No command specified. See -h for help.')
  }

  if (args.save && !args.bump) {
    throw new Error('--save is only valid with --bump')
  }

  if (args.show && !(args.profileLabel || args.bump)) {
    throw new Error('--show is only valid with --profile or --bump')
  }

  if (args.show && args.list) {
    throw new Error('--show cannot be used with --list')
  }

  if (primary.length > 1) {
    throw new Error(
      `Conflicting commands: ${usedTokens.join(', ')} — specify only one primary action`
    )
  }
}
