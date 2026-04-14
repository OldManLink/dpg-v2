import { describe, it, expect } from 'vitest'
import { validateProfileLabel } from '../src/profile-validation.js'

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
})
