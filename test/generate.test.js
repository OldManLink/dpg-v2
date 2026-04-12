import { describe, it, expect } from 'vitest'
import { generatePassword } from '../src/generate.js'
import { TEST_KDF } from './fixtures/kdf.js'
import { FULL_PROFILE, makeProfile } from './fixtures/profiles.js'
import {encodeContext} from "../src/context.js";
import {deriveSiteKey} from "../src/kdf.js";

describe('generatePassword', () => {
  it('is deterministic for the same master password and profile', async () => {
    const a = await generatePassword('correct horse battery staple', FULL_PROFILE, TEST_KDF)
    const b = await generatePassword('correct horse battery staple', FULL_PROFILE, TEST_KDF)

    expect(a).toBe(b)
  })

  it('changes when the master password changes', async () => {
    const a = await generatePassword('master one', FULL_PROFILE, TEST_KDF)
    const b = await generatePassword('master two', FULL_PROFILE, TEST_KDF)

    expect(a).not.toBe(b)
  })

  it('changes when the service changes', async () => {
    const a = await generatePassword('master', FULL_PROFILE, TEST_KDF)
    const b = await generatePassword('master', makeProfile({ service: 'gitlab.com' }), TEST_KDF)

    expect(a).not.toBe(b)
  })

  it('changes when the counter changes', async () => {
    const a = await generatePassword('master', FULL_PROFILE, TEST_KDF)
    const b = await generatePassword('master', makeProfile({ counter: 2 }), TEST_KDF)

    expect(a).not.toBe(b)
  })

  it('respects the profile length', async () => {
    const password = await generatePassword('master', makeProfile({ length: 16 }), TEST_KDF)

    expect(password).toHaveLength(16)
  })

  it('rejects an empty master password', async () => {
    await expect(
      generatePassword('', FULL_PROFILE, TEST_KDF)
    ).rejects.toThrow(/master password/i)
  })

})

describe('generatePassword (production Argon2)', () => {
  it('works end-to-end with production Argon2 parameters [slow]', async () => {
    const password = await generatePassword('master', FULL_PROFILE)

    expect(password).toHaveLength(FULL_PROFILE.length)
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[!@#]/)
  })

})

