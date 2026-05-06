import { describe, it, expect, vi } from 'vitest'
import {makeProfile} from "./fixtures/profiles.js";
import {computeCtxHash, withCtxHash} from "../src/context-hash.js";

describe('context hashes', () => {
  it('computes the same ctxHash for equivalent canonical contexts', () => {
    const a = makeProfile({symbolSet: '!@#', require: ['symbol', 'lower']})
    const b = makeProfile({symbolSet: '@!#', require: ['lower', 'symbol']})

    expect(computeCtxHash(a)).toBe(computeCtxHash(b))
  })

  it('computes different ctxHash values for different counters', () => {
    const a = makeProfile({counter: 1})
    const b = makeProfile({counter: 2})

    expect(computeCtxHash(a)).not.toBe(computeCtxHash(b))
  })

  it('does not include ctxHash itself in the context hash', () => {
    const a = makeProfile({ctxHash: 'old-hash'})
    const b = makeProfile({ctxHash: 'different-old-hash'})

    expect(computeCtxHash(a)).toBe(computeCtxHash(b))
  })

  it('adds ctxHash to a profile', () => {
    const profile = makeProfile({ctxHash: undefined})
    const updated = withCtxHash(profile)

    expect(updated.ctxHash).toBe(computeCtxHash(profile))
  })

  it('replaces stale ctxHash', () => {
    const profile = makeProfile({ctxHash: 'stale'})
    const updated = withCtxHash(profile)

    expect(updated.ctxHash).toBe(computeCtxHash(profile))
  })

  it('does not mutate the original profile', () => {
    const profile = makeProfile({ctxHash: 'stale'})
    const updated = withCtxHash(profile)

    expect(updated).not.toBe(profile)
    expect(profile.ctxHash).toBe('stale')
  })
})
