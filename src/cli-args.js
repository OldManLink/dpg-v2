/**
 * @typedef {{
 *   profileLabel: string | null,
 *   show: boolean,
 *   help: boolean,
 *   list: boolean,
 *   bump: string | null,
 *   save: boolean
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
 *   save: boolean
 * }}
 */
export function parseArgs(argv) {
  let profileLabel = null
  let show = false
  let help = false
  let list = false
  let bump = null
  let save = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '-p' || arg === '--profile') {
      const next = argv[++i]
      if (!next) {
        throw new Error('Missing profile label after -p/--profile')
      }
      profileLabel = next
    } else if (arg === '-b' || arg === '--bump') {
      const next = argv[++i]
      if (!next) {
        throw new Error('Missing profile label after -b/--bump')
      }
      bump = next
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

  return { profileLabel, show, help, list, bump, save }
}

export function usageText() {
  return [
    'Usage:',
    '  dpg -p <label>',
    '  dpg --profile <label>',
    '  dpg -p <label> --show',
    '  dpg --list',
    '  dpg -b <label>',
    '  dpg -b <label> --show',
    '  dpg -b <label> --save',
    '  dpg -b <label> --save --show',
    '  dpg --help',
    '',
    'Options:',
    '  -p, --profile <label>   Generate password from existing profile',
    '  -b, --bump <label>      Generate password using counter + 1',
    '      --save              Persist changes made by --bump',
    '      --show              Print generated password to stdout',
    '      --list              List available profiles',
    '  -h, --help              Show this help text'
  ].join('\n')
}
