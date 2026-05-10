import crypto from 'node:crypto'
import { encodeContext } from './context.js'
/** @typedef {import('./models.js').Profile} Profile */
/**
 * @param {Profile} profile
 * @returns string
 */
export function computeFullCtxHash(profile){
  return crypto
    .createHash('sha256')
    .update(encodeContext(profile))
    .digest('hex')}
/**
 * @param {Profile} profile
 * @param {number} hashAbbrev
 * @returns Profile
 */
export function withCtxHash(profile, hashAbbrev){
  return {
    ...profile,
    ctxHash: abbreviateCtxHash(computeFullCtxHash(profile), hashAbbrev)
  }
}

/**
 * Return copies of all profiles with ctxHash refreshed if missing.
 *
 * Intended for use when loading profiles, to ensure ctxHash is present
 * and up to date before further processing.
 *
 * This function does not perform any persistence.
 *
 * @param {Profile[]} profiles
 * @param {number} hashAbbrev
 * @returns {Profile[]}
 */
export function backfillCtxHashes(profiles, hashAbbrev) {
  return profiles.map(profile =>
    profile.ctxHash?.length === hashAbbrev
      ? profile
      : withCtxHash(profile, hashAbbrev)
  )
}

/**
 * Return the abbreviated form of a full context hash.
 *
 * @param {string} fullHash
 * @param {number} hashAbbrev
 * @returns {string}
 */
export function abbreviateCtxHash(fullHash, hashAbbrev) {
  if (typeof fullHash !== 'string') {
    throw new Error('fullHash must be a string')
  }

  if (!Number.isInteger(hashAbbrev) || hashAbbrev < 1) {
    throw new Error('hashAbbrev must be a positive integer')
  }

  return fullHash.slice(0, hashAbbrev)
}

/**
 * Find the minimum hash abbreviation length needed to avoid abbreviated-hash collisions.
 *
 * Real duplicate contexts have identical full hashes and do not require expansion.
 *
 * @param {Profile[]} profiles
 * @param {number} currentHashAbbrev
 * @param {(profile: Profile) => string} [computeFullHash]
 * @returns {number}
 */
export function findRequiredHashAbbrev(
  profiles,
  currentHashAbbrev,
  computeFullHash = computeFullCtxHash
) {
  /** @type {Map<string,Profile[]>}*/
  const buckets = new Map()

  for (const profile of profiles) {
    const key = profile.ctxHash
    if (!key) continue

    if (!buckets.has(key)) {
      buckets.set(key, [])
    }

    buckets.get(key).push(profile)
  }

  let required = currentHashAbbrev

  for (const bucket of buckets.values()) {
    if (bucket.length < 2) continue

    const fullHashes = bucket.map(profile => computeFullHash(profile))
    const uniqueFullHashes = [...new Set(fullHashes)]

    if (uniqueFullHashes.length < 2) {
      continue
    }

    required = Math.max(
      required,
      minimumDistinguishingPrefixLength(uniqueFullHashes)
    )
  }

  return required
}

/**
 * @param {string[]} fullHashes
 * @returns {number}
 */
function minimumDistinguishingPrefixLength(fullHashes) {
  let length = 1

  while (true) {
    const prefixes = new Set(fullHashes.map(hash => hash.slice(0, length)))

    if (prefixes.size === fullHashes.length) {
      return length
    }

    length += 1
  }
}
