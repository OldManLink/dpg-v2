import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
/** @typedef { import('./models.js').EditorSpawn } EditorSpawn */

/**
 * @param {string} label
 * @param {string} content
 * @returns {Promise<string>}
 */
export async function writeTempFile(label, content) {
  const safeLabel = label.replace(/[^A-Za-z0-9._-]/g, '_')
  const filePath = path.join(os.tmpdir(), `${safeLabel}_${Date.now()}.json`)
  await fs.writeFile(filePath, content, 'utf8')
  return filePath
}

/**
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function readTempFile(filePath) {
  return fs.readFile(filePath, 'utf8')
}

/**
 * @param {string} filePath
 * @returns {Promise<void>}
 */
export async function deleteTempFile(filePath) {
  try {
    await fs.unlink(filePath)
  } catch (err) {
    if (err && err.code === 'ENOENT') return
    throw err
  }
}

/**
 * @param {string} editor
 * @param {string} filePath
 * @param {EditorSpawn=} spawnImpl
 * @returns {Promise<number>}
 */
export async function openInEditor(editor, filePath, spawnImpl = spawn) {
  const parts = splitCommand(editor)

  if (parts.length === 0) {
    throw new Error('Editor command is empty')
  }

  const command = parts[0]
  const args = [...parts.slice(1), filePath]

  return new Promise((resolve, reject) => {
    const child = spawnImpl(command, args, { stdio: 'inherit' })

    child.on('error', reject)
    child.on('close', code => resolve(code ?? 1))
  })
}

/**
 * @param {string} commandLine
 * @returns {string[]}
 */
export function splitCommand(commandLine) {
  const parts = []
  let current = ''
  let quote = null

  for (const ch of commandLine) {
    if (quote) {
      if (ch === quote) {
        quote = null
      } else {
        current += ch
      }
      continue
    }

    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }

    if (/\s/.test(ch)) {
      if (current !== '') {
        parts.push(current)
        current = ''
      }
      continue
    }

    current += ch
  }

  if (current !== '') {
    parts.push(current)
  }

  return parts
}
