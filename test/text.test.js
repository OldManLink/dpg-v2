import { describe, it, expect } from 'vitest'
import { normalizeText } from '../src/text.js'

describe('normalizeText', () => {
  it('normalizes Unicode to NFC', () => {
    expect(normalizeText('café')).toBe(normalizeText('cafe\u0301'))
  })
})
