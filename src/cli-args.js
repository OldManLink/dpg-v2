/**
 * @param {string[]} argv
 * @returns {{ profileLabel: string | null, show: boolean, help: boolean }}
 */
export function parseArgs(argv) {
  let profileLabel = null
  let show = false
  let help = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '-p' || arg === '--profile') {
      const next = argv[++i]
      if (!next) {
        throw new Error('Missing profile label after -p/--profile')
      }
      profileLabel = next
    } else if (arg === '--show') {
      show = true
    } else if (arg === '--help' || arg === '-h') {
      help = true
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return { profileLabel, show, help }
}

export function usageText() {
  return [
    'Usage:',
    '  dpg -p <label>',
    '  dpg --profile <label>',
    '  dpg -p <label> --show',
    '  dpg --help'
  ].join('\n')
}
