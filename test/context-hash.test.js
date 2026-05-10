import { describe, it, expect, vi } from 'vitest'
import {makeProfile} from "./fixtures/profiles.js";
import {
  abbreviateCtxHash,
  backfillCtxHashes,
  computeFullCtxHash,
  findRequiredHashAbbrev,
  withCtxHash
} from "../src/context-hash.js";

describe('context hashes', () => {
  it('computes the same ctxHash for equivalent canonical contexts', () => {
    const a = makeProfile({symbolSet: '!@#', require: ['symbol', 'lower']})
    const b = makeProfile({symbolSet: '@!#', require: ['lower', 'symbol']})

    expect(computeFullCtxHash(a)).toBe(computeFullCtxHash(b))
  })

  it('computes different ctxHash values for different counters', () => {
    const a = makeProfile({counter: 1})
    const b = makeProfile({counter: 2})

    expect(computeFullCtxHash(a)).not.toBe(computeFullCtxHash(b))
  })

  it('does not include ctxHash itself in the context hash', () => {
    const a = makeProfile({ctxHash: 'old-hash'})
    const b = makeProfile({ctxHash: 'different-old-hash'})

    expect(computeFullCtxHash(a)).toBe(computeFullCtxHash(b))
  })

  it('adds ctxHash to a profile', () => {
    const profile = makeProfile({ctxHash: undefined})
    const updated = withCtxHash(profile, 7)

    expect(updated.ctxHash).toBe(abbreviateCtxHash(computeFullCtxHash(profile), 7))
  })

  it('replaces stale ctxHash', () => {
    const profile = makeProfile({ctxHash: 'stale'})
    const updated = withCtxHash(profile, 7)

    expect(updated.ctxHash).toBe(abbreviateCtxHash(computeFullCtxHash(profile), 7))
  })

  it('does not mutate the original profile', () => {
    const profile = makeProfile({ctxHash: 'stale'})
    const updated = withCtxHash(profile, 7)

    expect(updated).not.toBe(profile)
    expect(profile.ctxHash).toBe('stale')
  })

  it('abbreviates full hashes to requested length', () => {
    expect(abbreviateCtxHash('abcdef123456', 7)).toBe('abcdef1')
  })

  it('stores abbreviated ctxHash on profile', () => {
    const profile = withCtxHash(makeProfile({ label: 'github-main' }), 7)

    expect(profile.ctxHash).toHaveLength(7)
    expect(profile.ctxHash).toBe(
      abbreviateCtxHash(computeFullCtxHash(profile), 7)
    )
  })

  it('does not include ctxHash itself in the full hash', () => {
    const a = makeProfile({ ctxHash: 'aaaaaaa' })
    const b = makeProfile({ ctxHash: 'bbbbbbb' })

    expect(computeFullCtxHash(a)).toBe(computeFullCtxHash(b))
  })

  it('backfills missing ctxHash only', () => {
    const missing = makeProfile({ label: 'missing', ctxHash: undefined })
    const existing = makeProfile({ label: 'existing', ctxHash: '1234567' })

    const result = backfillCtxHashes([missing, existing], 7)

    expect(result[0].ctxHash).toHaveLength(7)
    expect(result[1].ctxHash).toBe('1234567')
  })

  it('refreshes wrong-length ctxHash', () => {
    const profile = makeProfile({ ctxHash: 'abc' })

    const result = backfillCtxHashes([profile], 7)

    expect(result[0].ctxHash).toHaveLength(7)
    expect(result[0].ctxHash).not.toBe('abc')
  })

  it('does not compute full hashes when abbreviated hashes are unique', () => {
    const profiles = [
      makeProfile({ label: 'a', ctxHash: 'abc1234' }),
      makeProfile({ label: 'b', ctxHash: 'def5678' })
    ]

    const computeFullHash = vi.fn()

    expect(findRequiredHashAbbrev(profiles, 7, computeFullHash)).toBe(7)
    expect(computeFullHash).not.toHaveBeenCalled()
  })

  it('expands when same abbreviation has different full hashes', () => {
    const profiles = [
      makeProfile({ label: 'a', ctxHash: 'abc' }),
      makeProfile({ label: 'b', ctxHash: 'abc' })
    ]

    const computeFullHash = vi.fn(profile => ({
      a: 'abc1ffff',
      b: 'abc2ffff'
    }[profile.label]))

    expect(findRequiredHashAbbrev(profiles, 3, computeFullHash)).toBe(4)
  })
})
