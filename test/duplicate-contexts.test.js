import {describe, it, expect} from 'vitest'
import {formatDuplicateDerivedPasswordWarning, formatDuplicateDerivedPasswordWarnings
       } from "../src/duplicate-contexts.js";

describe('duplicate warnings', () => {
  it('formats duplicate warning for two profiles', () => {
    expect(formatDuplicateDerivedPasswordWarning(['github-home', 'github-work']))
      .toBe('Warning: profiles derive the same password: github-home, github-work')
  })

  it('formats duplicate warning for three profiles', () => {
    expect(formatDuplicateDerivedPasswordWarning(['a', 'b', 'c']))
      .toBe('Warning: profiles derive the same password: a, b, c')
  })

  it('formats multiple duplicate groups as separate warnings', () => {
    expect(formatDuplicateDerivedPasswordWarnings([
      ['a', 'b'],
      ['x', 'y', 'z']
    ])).toBe(
      'Warning: profiles derive the same password: a, b\n' +
      'Warning: profiles derive the same password: x, y, z'
    )
  })
})
