import { describe, it, expect } from 'vitest'
import { extractEditableProfileFields, mergeEditableProfileFields,
  diffChangedEditableFields, validateEditableProfileFields } from '../src/editable-profile.js'
import { makeProfile, makeEditableProfileFields } from './fixtures/profiles.js'

describe('extractEditableProfileFields', () => {
  it('extracts only editable password-affecting fields', () => {
    const profile = makeProfile({
      service: 'github.com',
      account: 'peter@example.com',
      counter: 4,
      length: 20,
      require: ['lower', 'upper', 'digit', 'symbol'],
      symbolSet: '@!#',
      notes: 'should not be editable here'
    })

    expect(extractEditableProfileFields(profile)).toEqual({
      service: 'github.com',
      account: 'peter@example.com',
      counter: 4,
      length: 20,
      require: ['lower', 'upper', 'digit', 'symbol'],
      symbolSet: '@!#'
    })
  })
})

describe('mergeEditableProfileFields', () => {
  it('merges editable fields into the original profile without changing immutable fields', () => {
    const original = makeProfile({
      label: 'github-main',
      createdAt: '2026-04-22T00:00:00.000Z',
      updatedAt: '2026-04-22T00:00:00.000Z'
    })

    const edited = makeEditableProfileFields({
      service: 'github-enterprise.example.com',
      account: 'peter@corp.example',
      counter: 9,
      length: 24,
      require: ['lower', 'upper', 'digit'],
      symbolSet: '@!#'
    })

    const merged = mergeEditableProfileFields(original, edited)

    expect(merged.label).toBe('github-main')
    expect(merged.createdAt).toBe('2026-04-22T00:00:00.000Z')
    expect(merged.updatedAt).toBe('2026-04-22T00:00:00.000Z')

    expect(merged.service).toBe('github-enterprise.example.com')
    expect(merged.account).toBe('peter@corp.example')
    expect(merged.counter).toBe(9)
    expect(merged.length).toBe(24)
    expect(merged.require).toEqual(['lower', 'upper', 'digit'])
    expect(merged.symbolSet).toBeUndefined()
  })
})

describe('diffChangedEditableFields', () => {
  it('returns empty list when nothing changed', () => {
    const original = makeProfile()
    const edited = extractEditableProfileFields(original)

    expect(diffChangedEditableFields(original, edited)).toEqual([])
  })

  it('returns changed editable field names in stable order', () => {
    const original = makeProfile({
      service: 'github.com',
      account: 'peter@example.com',
      counter: 4,
      length: 20,
      require: ['lower', 'upper', 'digit', 'symbol'],
      symbolSet: '@!#'
    })

    const edited = makeEditableProfileFields({
      service: 'gitlab.com',
      account: 'peter@example.com',
      counter: 5,
      length: 20,
      require: ['lower', 'upper', 'digit'],
      symbolSet: '@!#'
    })

    expect(diffChangedEditableFields(original, edited)).toEqual([
      'service',
      'counter',
      'require'
    ])
  })

  it('rejects unknown require values', () => {
    expect(() =>
      validateEditableProfileFields({
        service: 'github.com',
        account: 'peter@example.com',
        counter: 4,
        length: 20,
        // @ts-ignore - intentional invalid RequireClass to test runtime validation
        require: ['runes', 'upper'],
        symbolSet: '@!#'
      })
    ).toThrow(/Unknown character class/i)
  })
})
