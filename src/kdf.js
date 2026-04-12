import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import setupWasm from 'argon2id/lib/setup.js'
import { ARGON2_PARAMS } from './argon2params.js'
import { normalizeText } from './text.js'

// This module provides the Node/test Argon2id loader.
// The browser runtime should use a browser-specific loader.

let argon2idPromise = null

async function getArgon2id() {
  if (!argon2idPromise) {
    const here = path.dirname(fileURLToPath(import.meta.url))
    const projectRoot = path.resolve(here, '..')

    const simdPath = path.join(
      projectRoot,
      'node_modules',
      'argon2id',
      'dist',
      'simd.wasm'
    )

    const noSimdPath = path.join(
      projectRoot,
      'node_modules',
      'argon2id',
      'dist',
      'no-simd.wasm'
    )

    argon2idPromise = setupWasm(
      importObject => WebAssembly.instantiate(fs.readFileSync(simdPath), importObject),
      importObject => WebAssembly.instantiate(fs.readFileSync(noSimdPath), importObject)
    )
  }

  return argon2idPromise
}

/**
 * @param {string} masterPassword
 * @param {Uint8Array} context
 * @param {{
 *   parallelism?: number,
 *   passes?: number,
 *   memorySize?: number,
 *   tagLength?: number
 * }=} overrides
 * @returns {Promise<Uint8Array>}
 */
export async function deriveSiteKey(masterPassword, context, overrides = {}) {
  const normalizedMaster = normalizeText(masterPassword)
  const passwordBytes = new TextEncoder().encode(normalizedMaster)

  const params = {
    ...ARGON2_PARAMS,
    ...overrides
  }

  const argon2id = await getArgon2id()

  const tag = argon2id({
    password: passwordBytes,
    salt: context,
    parallelism: params.parallelism,
    passes: params.passes,
    memorySize: params.memorySize,
    tagLength: params.tagLength
  })

  return new Uint8Array(tag)
}
