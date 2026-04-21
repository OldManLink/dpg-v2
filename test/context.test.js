import { describe, it, expect } from 'vitest'
import { encodeContext } from '../src/context.js'
import { makeProfile } from './fixtures/profiles.js'
/** @typedef {import('../src/models.js').RequireClass} RequireClass */

describe('encodeContext', () => {
  it('encodes fields deterministically', () => {
    const profile = makeProfile({
      counter: 1,
      length: 20,
      symbolSet: '!#$%&*+-=?@^_'
    })

    const result = encodeContext(profile)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('is stable across calls', () => {
    const profile = makeProfile({
      account: '',
      counter: 1,
      length: 16,
      require: ['lower', 'digit']
    })

    const a = encodeContext(profile)
    const b = encodeContext(profile)

    expect(Buffer.from(a)).toEqual(Buffer.from(b))
  })

  it('normalizes require order', () => {
    const p1 = makeProfile({
      service: 'x',
      account: '',
      counter: 1,
      length: 10,
      require: ['digit', 'upper']
    })

    /** @type {RequireClass[]} */
    const newOrder = ['upper', 'digit']
    const p2 = {
      ...p1,
      require: newOrder
    }

    expect(Buffer.from(encodeContext(p1)))
      .toEqual(Buffer.from(encodeContext(p2)))
  })

  it('changes when service changes', () => {
    const p1 = makeProfile({
      account: '',
      counter: 1,
      length: 16,
      require: ['lower']
    })

    const p2 = {
      ...p1,
      service: 'gitlab.com'
    }

    expect(Array.from(encodeContext(p1)))
      .not.toEqual(Array.from(encodeContext(p2)))
  })

  it('changes when counter changes', () => {
    const p1 = makeProfile({
      account: '',
      counter: 1,
      length: 16,
      require: ['lower']
    })

    const p2 = {
      ...p1,
      counter: 2
    }

    expect(Array.from(encodeContext(p1)))
      .not.toEqual(Array.from(encodeContext(p2)))
  })
})

