import { encodeContext } from './context.js'
import { computeCtxHash } from './context-hash.js'
/** @typedef {import('./models.js').Profile} Profile */
/**
 * @param Profile[] profiles
 * @returns string[]
 */
export function findDuplicateDerivedPasswordGroups(profiles){
  const buckets = new Map()

  for (const profile of profiles) {
    const hash = profile.ctxHash ?? computeCtxHash(profile)

    if (!buckets.has(hash)) {
      buckets.set(hash, [])
    }

    buckets.get(hash).push(profile)
  }

  const groups = []

  for (const bucket of buckets.values()) {
    if (bucket.length < 2) continue

    const contextBuckets = new Map()

    for (const profile of bucket) {
      const contextKey = Buffer.from(encodeContext(profile)).toString('base64')

      if (!contextBuckets.has(contextKey)) {
        contextBuckets.set(contextKey, [])
      }

      contextBuckets.get(contextKey).push(profile.label)
    }

    for (const labels of contextBuckets.values()) {
      if (labels.length > 1) {
        groups.push([...labels].sort((a, b) => a.localeCompare(b)))
      }
    }
  }

  return groups.sort((a, b) => a[0].localeCompare(b[0]))
}

/**
 * @param string[] labels
 * @returns string
 */
export function formatDuplicateDerivedPasswordWarning(labels){
  return `Warning: profiles derive the same password: ${labels.join(', ')}`
}

/**
 * @param string[][] labelGroups
 * @returns string
 */
export function formatDuplicateDerivedPasswordWarnings(labelGroups){
  return labelGroups
    .map(formatDuplicateDerivedPasswordWarning)
    .join('\n')
}
