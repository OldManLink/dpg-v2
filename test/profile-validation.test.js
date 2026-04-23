import { describe, it, expect } from 'vitest'
import { validateProfileLabel } from '../src/profile-validation.js'
import {canonicalRequire} from "../src/password.js";

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
})
