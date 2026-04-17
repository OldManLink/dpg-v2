import { describe, it, expect } from 'vitest'
import { serializeProfilePretty } from '../src/profile-serialization.js'
import { makeProfile } from './fixtures/profiles.js'

describe('serializeProfilePretty', () => {
  it('returns valid pretty-printed JSON', () => {
    const profile = makeProfile({ label: 'github-main' })
    const text = serializeProfilePretty(profile)
    const parsed = JSON.parse(text)

    expect(parsed.label).toBe('github-main')
    expect(text).toContain('\n')
    expect(text).toContain('  ')
  })

  it('serializes all present fields in stable order', () => {
    const profile = makeProfile({
      account: 'peter@example.com',
      notes: 'Main account'
    })

    const text = serializeProfilePretty(profile)
    const parsed = JSON.parse(text)

    expect(parsed).toEqual(profile)

    expect(Object.keys(parsed)).toEqual([
      'version',
      'label',
      'service',
      'account',
      'counter',
      'length',
      'require',
      'symbolSet',
      'notes',
      'createdAt',
      'updatedAt'
    ])
  })

  it('omits optional fields that are not present', () => {
    const profile = makeProfile()
    delete profile.account
    delete profile.notes

    const text = serializeProfilePretty(profile)
    const parsed = JSON.parse(text)

    expect(parsed.account).toBeUndefined()
    expect(parsed.notes).toBeUndefined()

    expect(Object.keys(parsed)).toEqual([
      'version',
      'label',
      'service',
      'counter',
      'length',
      'require',
      'symbolSet',
      'createdAt',
      'updatedAt'
    ])
  })

  it('does not mutate the original profile', () => {
    const profile = makeProfile({ label: 'github-main' })
    const before = JSON.stringify(profile)

    serializeProfilePretty(profile)

    expect(JSON.stringify(profile)).toBe(before)
  })
})
