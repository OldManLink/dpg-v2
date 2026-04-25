import { encodeContext } from './context.js'
import { deriveSiteKey } from './kdf.js'
import { generatePasswordFromSiteKey } from './password.js'
import {canonicalRequire, canonicalSymbolSet} from "./profile-validation.js";

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

  const normalizedProfile = {
    ...profile,
    require: canonicalRequire(profile.require),
    symbolSet: canonicalSymbolSet(profile.symbolSet)
  }

  const context = encodeContext(normalizedProfile)
  const siteKey = await deriveSiteKey(masterPassword, context, kdfOverrides)
  return generatePasswordFromSiteKey(siteKey, profile)
}
