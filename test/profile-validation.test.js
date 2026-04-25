import { describe, it, expect } from 'vitest'
import {canonicalRequire, canonicalSymbolSet, validateProfileLabel} from '../src/profile-validation.js'

describe('validateProfileLabel', () => {
  it('accepts simple labels', () => {
    expect(validateProfileLabel('github-main')).toBe(true)
    expect(validateProfileLabel('github_main')).toBe(true)
    expect(validateProfileLabel('github.main')).toBe(true)
    expect(validateProfileLabel('GitHub-2026')).toBe(true)
  })

  it('rejects empty labels', () => {
    expect(() => validateProfileLabel('')).toThrow(/invalid profile label/i)
  })

  it('rejects labels with forbidden characters', () => {
    expect(() => validateProfileLabel('Gïthüb-mäin')).toThrow(/invalid profile label/i)
  })

  it('rejects labels with spaces', () => {
    expect(() => validateProfileLabel('github main')).toThrow(/invalid profile label/i)
  })

  it('orders require values canonically', () => {
    expect(canonicalRequire(['symbol', 'lower', 'digit'])).toEqual([
      'lower',
      'digit',
      'symbol'
    ])
  })

  it('keeps canonical order unchanged', () => {
    expect(canonicalRequire(['lower', 'upper', 'digit', 'symbol']))
      .toEqual(['lower', 'upper', 'digit', 'symbol'])
  })

  it('normalizes different input orders to the same output', () => {
    const a = canonicalRequire(['symbol', 'lower'])
    const b = canonicalRequire(['lower', 'symbol'])

    expect(a).toEqual(b)
  })

  it('deduplicates and orders require values', () => {
    expect(canonicalRequire(['upper', 'lower', 'upper']))
      .toEqual(['lower', 'upper'])
  })

  describe('canonicalSymbolSet', () => {
    it('keeps canonical symbol order unchanged', () => {
      expect(canonicalSymbolSet('@%+/!#$^.()[]{}~-_')).toBe('@%+/!#$^.()[]{}~-_')
    })

    it('normalizes symbolSet to canonical order', () => {
      expect(canonicalSymbolSet('!@#')).toBe('@!#')
    })

    it('normalizes different input orders to the same output', () => {
      expect(canonicalSymbolSet('#!@')).toBe(canonicalSymbolSet('@#!'))
    })

    it('rejects duplicate characters', () => {
      expect(() => canonicalSymbolSet('@!#!')).toThrow(
        /symbolSet contains duplicated character: '!'/i
      )
    })

    it('rejects lowercase letters', () => {
      expect(() => canonicalSymbolSet('!a')).toThrow(
        /symbolSet contains invalid character: 'a'/i
      )
    })

    it('rejects uppercase letters', () => {
      expect(() => canonicalSymbolSet('!A')).toThrow(
        /symbolSet contains invalid character: 'A'/i
      )
    })

    it('rejects digits', () => {
      expect(() => canonicalSymbolSet('!0')).toThrow(
        /symbolSet contains invalid character: '0'/i
      )
    })

    it('rejects unsupported symbols', () => {
      expect(() => canonicalSymbolSet('!*')).toThrow(
        /symbolSet contains invalid character: '\*'/i
      )
    })

    it('rejects empty symbolSet', () => {
      expect(() => canonicalSymbolSet('')).toThrow(
        /symbolSet must not be empty/i
      )
    })
  })

})
