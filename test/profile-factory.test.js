import { describe, it, expect } from 'vitest'
import { createDefaultProfile } from '../src/profile-factory.js'

describe('createDefaultProfile', () => {
  it('creates a valid default profile', () => {
    const profile = createDefaultProfile('github-main', '2026-04-14T12:00:00.000Z')

    expect(profile).toEqual({
      version: 'dpg:v2',
      label: 'github-main',
      service: 'github-main',
      counter: 0,
      length: 20,
      require: ['lower', 'upper', 'digit', 'symbol'],
      symbolSet: '!@#',
      createdAt: '2026-04-14T12:00:00.000Z',
      updatedAt: '2026-04-14T12:00:00.000Z'
    })
  })
})
