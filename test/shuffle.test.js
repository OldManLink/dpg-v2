import { describe, it, expect } from 'vitest'
import { deterministicShuffle } from '../src/shuffle.js'
import { ByteStream } from '../src/stream.js'

function stream() {
  return new ByteStream(new Uint8Array(32).fill(9))
}

describe('deterministicShuffle', () => {
  it('reorders array deterministically', () => {
    const a1 = ['a', 'b', 'c', 'd']
    const a2 = ['a', 'b', 'c', 'd']

    deterministicShuffle(a1, stream())
    deterministicShuffle(a2, stream())

    expect(a1).toEqual(a2)
  })

  it('preserves elements', () => {
    const arr = ['a', 'b', 'c', 'd']

    deterministicShuffle(arr, stream())

    expect(arr.sort()).toEqual(['a', 'b', 'c', 'd'])
  })
})
