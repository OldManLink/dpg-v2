import { loadProfileByLabel, saveProfiles, loadAllProfiles } from './profiles-file.js'
import { createDefaultProfile } from './profile-factory.js'
import { promptForMasterPassword } from './prompt.js'
import { generatePassword } from './generate.js'
import { copyToClipboard } from './clipboard.js'
import { usageText } from './cli-args.js'
import { promptForConfirmation } from './confirm.js'
import { serializeProfilePretty } from './profile-serialization.js'
import { formatProfileList } from './list-formatting.js'
import { loadConfig, saveConfig, parseConfigAssignment, applyConfigUpdate } from "./config-file.js";
import { readTempFile, writeTempFile, deleteTempFile, openInEditor } from "./editor.js"
import { diffChangedEditableFields, extractEditableProfileFields, mergeEditableProfileFields,
  validateEditableProfileFields} from "./editable-profile.js";
import { ProfilesRepository } from './profiles-repository.js'
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
    readTempFile: readTemp = readTempFile,
    writeTempFile: writeTemp = writeTempFile,
    deleteTempFile: deleteTemp = deleteTempFile,
    openInEditor: openEditor = openInEditor,
    loadConfig: loadCfg = loadConfig,
    saveConfig: saveCfg = saveConfig,
    ProfilesRepositoryClass = ProfilesRepository,
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
      const repo = await ProfilesRepositoryClass.load({
        loadAllProfiles: loadAll,
        saveProfiles: save
      })

      stdout.write(formatProfileList(repo.list()) + '\n')
      return 0    }

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

    if (args.editLabel) {
      const original = await load(args.editLabel)

      const editable = extractEditableProfileFields(original)
      const content = JSON.stringify(editable, null, 2)

      const tempPath = await writeTemp(args.editLabel, content)

      try {
        const config = await loadCfg()

        const editor =
          config.editor && config.editor.trim() !== ''
            ? config.editor
            : process.env.EDITOR && process.env.EDITOR.trim() !== ''
              ? process.env.EDITOR
              : 'vi'

        const exitCode = await openEditor(editor, tempPath)

        if (exitCode !== 0) {
          stdout.write('Edit cancelled\n')
          return 1
        }

        const editedText = await readTemp(tempPath)
        let editedFields
        try {
          editedFields = JSON.parse(editedText)
        } catch {
          stderr.write('Invalid JSON in edited profile\n')
          return 1
        }
        validateEditableProfileFields(editedFields)

        const changedFields = diffChangedEditableFields(original, editedFields)

        if (changedFields.length === 0) {
          stdout.write('No changes made\n')
          return 0
        }

        stdout.write(`Changed fields: ${changedFields.join(', ')}\n`)
        stdout.write('Warning: changes to this profile will affect the generated password.\n')

        const answer = await confirm(
          `Save changes to profile '${args.editLabel}'? (y/N) `
        )

        if (answer !== 'y') {
          stdout.write('No changes saved\n')
          return 0
        }

        const updatedProfile = {
        ...mergeEditableProfileFields(original, editedFields),
            updatedAt: new Date().toISOString()
        }

        const all = await loadAll()
        const updated = all.map(p => p.label === original.label ? updatedProfile : p)

        await save(updated)
        stdout.write(`Updated profile '${args.editLabel}'\n`)
        return 0
      } finally {
        await deleteTemp(tempPath)
      }
    }

    if (args.deleteLabel) {
      const repo = await ProfilesRepositoryClass.load({
        loadAllProfiles: loadAll,
        saveProfiles: save
      })

      const profile = repo.get(args.deleteLabel)

      if (!profile) {
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

      repo.delete(args.deleteLabel)
      await repo.persist()

      stdout.write(`Deleted profile: '${args.deleteLabel}'\n`)
      return 0
    }

    if (args.showProfileLabel) {
      const repo = await ProfilesRepositoryClass.load({
        loadAllProfiles: loadAll,
        saveProfiles: save
      })

      const profile = repo.get(args.showProfileLabel)

      if (!profile) {
        stderr.write(`Profile '${args.showProfileLabel}' does not exist\n`)
        return 1
      }

      stdout.write(`${serializeProfilePretty(profile)}\n`)
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

    const repo = await ProfilesRepositoryClass.load({
      loadAllProfiles: loadAll,
      saveProfiles: save
    })

    const profile = repo.get(args.profileLabel)

    if (!profile) {
      stderr.write(`Profile not found: '${args.profileLabel}'\n`)
      return 1
    }

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

  if (args.editLabel) {
    primary.push('edit')
    usedTokens.push('-e')
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
