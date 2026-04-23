import { encodeContext } from './context.js'
import { deriveSiteKey } from './kdf.js'
import { generatePasswordFromSiteKey } from './password.js'

/**
 * @param {string} masterPassword
 * @param {object} profile
 * @param {object=} kdfOverrides
 * @returns {Promise<string>}
 */
// generatePassword is async because Argon2id initialization/execution is async.
export async function generatePassword(masterPassword, profile,  kdfOverrides = undefined) {
  if (typeof masterPassword !== 'string' || masterPassword.length === 0) {
    throw new Error('Master password must not be empty')
  }

  const context = encodeContext(profile)
  const siteKey = await deriveSiteKey(masterPassword, context, kdfOverrides)
  return generatePasswordFromSiteKey(siteKey, profile)
}
