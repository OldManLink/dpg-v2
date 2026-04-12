import { describe, it, expect } from 'vitest'
import { ByteStream } from '../src/stream.js'

function dummyKey() {
  return new Uint8Array(32).fill(7)
}

describe('ByteStream', () => {
  it('produces deterministic bytes', () => {
    const s1 = new ByteStream(dummyKey())
    const s2 = new ByteStream(dummyKey())

    const out1 = Array.from({ length: 64 }, () => s1.next())
    const out2 = Array.from({ length: 64 }, () => s2.next())

    expect(out1).toEqual(out2)
  })

  it('produces different streams for different keys', () => {
    const k1 = new Uint8Array(32).fill(1)
    const k2 = new Uint8Array(32).fill(2)

    const s1 = new ByteStream(k1)
    const s2 = new ByteStream(k2)

    const out1 = Array.from({ length: 32 }, () => s1.next())
    const out2 = Array.from({ length: 32 }, () => s2.next())

    expect(out1).not.toEqual(out2)
  })

  it('can generate more than one block', () => {
    const s = new ByteStream(dummyKey())

    const bytes = Array.from({ length: 100 }, () => s.next())

    expect(bytes.length).toBe(100)
  })
})
