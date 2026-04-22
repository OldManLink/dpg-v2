import { ByteStream } from './stream.js'

/**
 * @param {ByteStream} stream
 * @param {number} n
 * @returns {number}
 */
export function uniformIndex(stream, n) {
  if (n <= 0 || n > 256) {
    throw new Error('n must be between 1 and 256')
  }

  if (n === 1) return 0

  const limit = Math.floor(256 / n) * n

  while (true) {
    const b = stream.next()
    if (b < limit) {
      return b % n
    }
  }
}
