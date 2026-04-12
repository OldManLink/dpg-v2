import crypto from 'node:crypto'

export class ByteStream {
  /**
   * @param {Uint8Array} siteKey
   */
  constructor(siteKey) {
    this.key = Buffer.from(siteKey)
    this.blockIndex = 0
    /** @type {number[]} */
    this.buffer = []
  }

  /**
   * @returns {number}
   */
  next() {
    if (this.buffer.length === 0) {
      this._fillBuffer()
    }

    const value = this.buffer.shift()
    if (value === undefined) {
      throw new Error('ByteStream internal error: empty buffer')
    }
    return value
  }

  _fillBuffer() {
    const hmac = crypto.createHmac('sha256', this.key)

    const prefix = Buffer.from('DPGSTREAM\0', 'utf8')
    const counter = Buffer.alloc(4)
    counter.writeUInt32BE(this.blockIndex, 0)

    hmac.update(prefix)
    hmac.update(counter)

    const block = hmac.digest()

    this.buffer = []
    for (let i = 0; i < block.length; i++) {
      this.buffer.push(block[i])
    }

    this.blockIndex++
  }
}
