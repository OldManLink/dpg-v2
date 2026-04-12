import { spawn as realSpawn } from 'node:child_process'
import { accessSync, constants } from 'node:fs'
import path from 'node:path'

/**
 * @param {string} name
 * @returns {boolean}
 */
function commandExists(name) {
  /** @type {string} */
  const pathValue = process.env.PATH ?? ''
  const extensions = process.platform === 'win32'
    ? ['.exe', '.cmd', '.bat', '']
    : ['']

  for (const dir of pathValue.split(path.delimiter)) {
    for (const ext of extensions) {
      try {
        accessSync(path.join(dir, name + ext), constants.X_OK)
        return true
      } catch {
        // keep looking
      }
    }
  }

  return false
}

/**
 * @typedef {{
 *   stdin: {
 *     end: (text: string) => void
 *   },
 *   on: (event: 'error' | 'close', handler: (value: any) => void) => void
 * }} ClipboardChildProcess
 */

/**
 * @typedef {(command: string, args: string[], options: object) => ClipboardChildProcess} ClipboardSpawn
 */

/**
 * @param {{ platform?: string, hasCommand?: (name: string) => boolean }=} options
 * @returns {{ command: string, args: string[] }}
 */
export function getClipboardCommand(options = {}) {
  const platform = options.platform ?? process.platform
  const hasCommand = options.hasCommand ?? commandExists

  switch (platform) {
    case 'darwin':
      return { command: 'pbcopy', args: [] }

    case 'win32':
      return { command: 'clip', args: [] }

    case 'linux':
      if (hasCommand('wl-copy')) {
        return { command: 'wl-copy', args: [] }
      }
      if (hasCommand('xclip')) {
        return { command: 'xclip', args: ['-selection', 'clipboard'] }
      }
      if (hasCommand('xsel')) {
        return { command: 'xsel', args: ['--clipboard', '--input'] }
      }
      throw new Error('No supported clipboard tool is available on this Linux system')

    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

/**
 * @param {string} text
 * @param {{
 *   platform?: string,
 *   hasCommand?: (name: string) => boolean,
 *   spawn?: ClipboardSpawn
 * }=} options
 * @returns {Promise<void>}
 */
export function copyToClipboard(text, options = {}) {
  const { command, args } = getClipboardCommand(options)
  /** @type {ClipboardSpawn} */
  const spawn = options.spawn ?? realSpawn

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'pipe'] })

    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Clipboard command failed: ${command}`))
      }
    })

    child.stdin.end(text)
  })
}
