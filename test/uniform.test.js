import { describe, it, expect } from 'vitest'
import { uniformIndex } from '../src/uniform.js'
import { ByteStream } from '../src/stream.js'

function stream() {
  return new ByteStream(new Uint8Array(32).fill(3))
}

describe('uniformIndex', () => {
  it('returns values within range', () => {
    const s = stream()

    for (let i = 0; i < 100; i++) {
      const v = uniformIndex(s, 10)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(10)
    }
  })

  it('works for edge case n=1', () => {
    const s = stream()

    for (let i = 0; i < 10; i++) {
      expect(uniformIndex(s, 1)).toBe(0)
    }
  })

  it('produces deterministic sequence', () => {
    const s1 = stream()
    const s2 = stream()

    const out1 = Array.from({ length: 50 }, () => uniformIndex(s1, 7))
    const out2 = Array.from({ length: 50 }, () => uniformIndex(s2, 7))

    expect(out1).toEqual(out2)
  })
})
