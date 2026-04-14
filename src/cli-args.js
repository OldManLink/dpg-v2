/**
 * @typedef {{
 *   profileLabel: string | null,
 *   show: boolean,
 *   help: boolean,
 *   list: boolean,
 *   bump: string | null,
 *   save: boolean,
 *   create: string | null,
 *   deleteLabel: string | null
 * }} CliArgs
 */

/**
 * @param {string[]} argv
 * @returns {{
 *   profileLabel: string | null,
 *   show: boolean,
 *   help: boolean,
 *   list: boolean,
 *   bump: string | null,
 *   save: boolean,
 *   create: string | null,
 *   deleteLabel: string | null
 * }}
 */
export function parseArgs(argv) {
  let profileLabel = null
  let show = false
  let help = false
  let list = false
  let bump = null
  let save = false
  let create = null
  let deleteLabel = null

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
    } else if (arg === '-D' || arg === '--delete') {
      const next = argv[++i]
      if (!next) {
        throw new Error('Missing profile label after -D/--delete')
      }
      deleteLabel = next
    } else if (arg === '--list') {
      list = true
    } else if (arg === '--save') {
      save = true
    } else if (arg === '--show') {
      show = true
    } else if (arg === '--help' || arg === '-h') {
      help = true
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return { profileLabel, show, help, list, bump, save, create, deleteLabel }
}

export function usageText() {
  return [
    'Usage:',
    '  dpg -p <label>',
    '  dpg --profile <label>',
    '  dpg -p <label> --show',
    '  dpg -n <label>',
    '  dpg --new <label>',
    '  dpg -D <label>',
    '  dpg --delete <label>',
    '  dpg --list',
    '  dpg -b <label>',
    '  dpg -b <label> --show',
    '  dpg -b <label> --save',
    '  dpg -b <label> --save --show',
    '  dpg --help',
    '',
    'Options:',
    '  -p, --profile <label>   Generate password from existing profile',
    '  -n, --new <label>       Create new profile with default values',
    '  -D, --delete <label>    Delete an existing profile (confirmation required)',
    '  -b, --bump <label>      Generate password using counter + 1',
    '      --save              Persist changes made by --bump',
    '      --show              Print generated password to stdout',
    '      --list              List available profiles',
    '  -h, --help              Show this help text'
  ].join('\n')
}
