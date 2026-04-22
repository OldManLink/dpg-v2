import {describe, expect, it} from 'vitest'
import {generatePassword} from '../src/generate.js'
import {DEFAULT_PROFILE} from './fixtures/profiles.js'

describe('generatePassword (production Argon2)', () => {
  it('works end-to-end with production Argon2 parameters [slow]', async () => {
    const password = await generatePassword('master', DEFAULT_PROFILE)

    expect(password).toHaveLength(DEFAULT_PROFILE.length)
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[!@#]/)
  })
})
