import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

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
 * @returns {Promise<number>}
 */
export async function openInEditor(editor, filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(editor, [filePath], { stdio: 'inherit' })

    child.on('error', reject)
    child.on('close', code => resolve(code ?? 1))
  })
}
