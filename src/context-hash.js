import crypto from 'node:crypto'
import { encodeContext } from './context.js'
/** @typedef {import('./models.js').Profile} Profile */
/**
 * @param {Profile} profile
 * @returns string
 */
export function computeCtxHash(profile){
  return crypto
    .createHash('sha256')
    .update(encodeContext(profile))
    .digest('hex')}
/**
 * @param {Profile} profile
 * @returns Profile
 */
export function withCtxHash(profile){
  return {
    ...profile,
    ctxHash: computeCtxHash(profile)
  }}

/**
 * Return copies of all profiles with ctxHash refreshed.
 *
 * @param {Profile[]} profiles
 * @returns {Profile[]}
 */
export function withCtxHashes(profiles) {
  return profiles.map(withCtxHash)
}

/**
 * Return copies of all profiles with ctxHash refreshed.
 *
 * Intended for use when loading profiles, to ensure ctxHash is present
 * and up to date before further processing.
 *
 * This function does not perform any persistence.
 *
 * @param {Profile[]} profiles
 * @returns {Profile[]}
 */
export function backfillCtxHashes(profiles) {
  return withCtxHashes(profiles)
}
