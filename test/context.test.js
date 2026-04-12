import { describe, it, expect } from 'vitest'
import { encodeContext } from '../src/context.js'

describe('encodeContext', () => {
  it('encodes fields deterministically', () => {
    const profile = {
      version: 'dpg:v2',
      service: 'github.com',
      account: 'peter@example.com',
      counter: 1,
      length: 20,
      require: ['lower', 'upper', 'digit', 'symbol'],
      symbolSet: '!#$%&*+-=?@^_'
    }

    const result = encodeContext(profile)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('is stable across calls', () => {
    const profile = {
      version: 'dpg:v2',
      service: 'github.com',
      account: '',
      counter: 1,
      length: 16,
      require: ['lower', 'digit'],
      symbolSet: '!@#'
    }

    const a = encodeContext(profile)
    const b = encodeContext(profile)

    expect(Buffer.from(a)).toEqual(Buffer.from(b))
  })

  it('normalizes require order', () => {
    const p1 = {
      version: 'dpg:v2',
      service: 'x',
      account: '',
      counter: 1,
      length: 10,
      require: ['digit', 'upper'],
      symbolSet: '!@#'
    }

    const p2 = {
      ...p1,
      require: ['upper', 'digit']
    }

    expect(Buffer.from(encodeContext(p1)))
      .toEqual(Buffer.from(encodeContext(p2)))
  })

  it('changes when service changes', () => {
    const p1 = {
      version: 'dpg:v2',
      service: 'github.com',
      account: '',
      counter: 1,
      length: 16,
      require: ['lower'],
      symbolSet: '!@#'
    }

    const p2 = {
      ...p1,
      service: 'gitlab.com'
    }

    expect(Array.from(encodeContext(p1)))
      .not.toEqual(Array.from(encodeContext(p2)))
  })

  it('changes when counter changes', () => {
    const p1 = {
      version: 'dpg:v2',
      service: 'github.com',
      account: '',
      counter: 1,
      length: 16,
      require: ['lower'],
      symbolSet: '!@#'
    }

    const p2 = {
      ...p1,
      counter: 2
    }

    expect(Array.from(encodeContext(p1)))
      .not.toEqual(Array.from(encodeContext(p2)))
  })

})

