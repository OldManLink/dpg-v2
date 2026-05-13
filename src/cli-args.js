/** @typedef {import('./models.js').CliArgs} CliArgs */

/**
 * @param {string[]} argv
 * @returns {CliArgs}
 */
export function parseArgs(argv) {
  let init=false
  let profileLabel = null
  let show = false
  let help = false
  let list = false
  let bump = null
  let save = false
  let create = null
  let deleteLabel = null
  let showProfileLabel = null
  let configPresent = false
  let configArg = null
  let editLabel = null

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '-p' || arg === '--profile') {
      const next = argv[++i]
      if (!next) {
        throw new Error('Missing profile label after -p/--profile')
      }
      profileLabel = next
    } else if (arg === '-n' || arg === '--new') {
      const next = argv[++i]
      if (!next) {
        throw new Error('Missing profile label after -n/--new')
      }
      create = next
    } else if (arg === '-b' || arg === '--bump') {
      const next = argv[++i]
      if (!next) {
        throw new Error('Missing profile label after -b/--bump')
      }
      bump = next
    } else if (arg === '-e' || arg === '--edit') {
      const next = argv[++i]
      if (!next) {
        throw new Error('Missing profile label after -e/--edit')
      }
      editLabel = next
    } else if (arg === '-D' || arg === '--delete') {
      const next = argv[++i]
      if (!next) {
        throw new Error('Missing profile label after -D/--delete')
      }
      deleteLabel = next
    } else if (arg === '--show-profile') {
      const next = argv[++i]
      if (!next) {
        throw new Error('Missing profile label after --show-profile')
      }
      showProfileLabel = next
    } else if (arg === '-c' || arg === '--config') {
      configPresent = true
      const next = argv[i + 1]
      if (next && !next.startsWith('-')) {
        if (!next.includes('=')) {
          throw new Error('Config update must use key=value syntax')
        }

        configArg = next
        i++
      }
    } else if (arg === '--list') {
      list = true
    } else if (arg === '--save') {
      save = true
    } else if (arg === '--show') {
      show = true
    } else if (arg === '--init') {
      init = true
    } else if (arg === '--help' || arg === '-h') {
      help = true
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return { init, profileLabel, show, help, list, bump, save, create, deleteLabel, showProfileLabel, configPresent, configArg, editLabel }
}

export function usageText() {
  return [
    'Usage:',
    '  dpg-cli --init',
    '  dpg-cli -p <label>',
    '  dpg-cli --profile <label>',
    '  dpg-cli -p <label> --show',
    '  dpg-cli --list',
    '  dpg-cli -b <label>',
    '  dpg-cli -b <label> --show',
    '  dpg-cli -b <label> --save',
    '  dpg-cli -b <label> --save --show',
    '  dpg-cli -n <label>',
    '  dpg-cli --new <label>',
    '  dpg-cli -e <label>',
    '  dpg-cli --edit <label>',
    '  dpg-cli -D <label>',
    '  dpg-cli --delete <label>',
    '  dpg-cli --show-profile <label>',
    '  dpg-cli -c',
    '  dpg-cli --config',
    '  dpg-cli -c <key=value>',
    '  dpg-cli --config <key=value>',
    '  dpg-cli --help',
    '',
    'Options:',
    '      --init                   Initialise config and profiles storage',
    '  -p, --profile <label>        Generate password from existing profile',
    '  -b, --bump <label>           Generate password using counter + 1',
    '      --save                   Persist changes made by --bump',
    '      --show                   Print generated password to stdout',
    '      --list                   List available profiles',
    '  -n, --new <label>            Create a new profile with default values',
    '  -e, --edit <label>           Edit a profile in your editor',
    '  -D, --delete <label>         Delete an existing profile (confirmation required)',
    '      --show-profile <label>   Pretty-print a profile as JSON',
    '      -c, --config [key=value] Show config or update a single config value',
    '  -h, --help                   Show this help text'
  ].join('\n')
}
