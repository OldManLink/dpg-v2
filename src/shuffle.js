import { uniformIndex } from './uniform.js'
import { ByteStream } from './stream.js'

/**
 * @param {Array<string>} arr
 * @param {ByteStream} stream
 * @returns void
 */
export function deterministicShuffle(arr, stream) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = uniformIndex(stream, i + 1)
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
}
