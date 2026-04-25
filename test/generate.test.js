import {describe, expect, it} from 'vitest'
import {generatePassword} from '../src/generate.js'
import {TEST_KDF} from './fixtures/kdf.js'
import {DEFAULT_PROFILE, makeProfile} from './fixtures/profiles.js'

describe('generatePassword', () => {
  it('is deterministic for the same master password and profile', async () => {
    const a = await generatePassword('correct horse battery staple', DEFAULT_PROFILE, TEST_KDF)
    const b = await generatePassword('correct horse battery staple', DEFAULT_PROFILE, TEST_KDF)

    expect(a).toBe(b)
  })

  it('changes when the master password changes', async () => {
    const a = await generatePassword('master one', DEFAULT_PROFILE, TEST_KDF)
    const b = await generatePassword('master two', DEFAULT_PROFILE, TEST_KDF)

    expect(a).not.toBe(b)
  })

  it('changes when the service changes', async () => {
    const a = await generatePassword('master', DEFAULT_PROFILE, TEST_KDF)
    const b = await generatePassword('master', makeProfile({service: 'gitlab.com'}), TEST_KDF)

    expect(a).not.toBe(b)
  })

  it('changes when the counter changes', async () => {
    const a = await generatePassword('master', DEFAULT_PROFILE, TEST_KDF)
    const b = await generatePassword('master', makeProfile({counter: 2}), TEST_KDF)

    expect(a).not.toBe(b)
  })

  it('respects the profile length', async () => {
    const password = await generatePassword('master', makeProfile({length: 16}), TEST_KDF)

    expect(password).toHaveLength(16)
  })

  it('rejects an empty master password', async () => {
    const {toThrow} = expect(
        generatePassword('', DEFAULT_PROFILE, TEST_KDF)
    // Promise rejection assertion (supported by Vitest)
    )["rejects"];
    await toThrow(/master password/i)
  })

})

describe('generatePassword (Golden test using production Argon2)', () => {
  // Golden test. If this fails, either:
  // 1) you improved the algorithm (unlikely), or
  // 2) you broke something (more likely)
  it('produces expected password for known inputs [golden|slow]', async () => {
    const profile = {
      version: 'dpg:v2',
      label: 'andrew-test',
      service: 'Andrew Martin',
      account: '',
      counter: 42,
      length: 16,
      require: ['lower', 'upper', 'digit', 'symbol'],
      symbolSet: '@!#{}[]()+-'
    }

    const password = await generatePassword(
      'Walking Thoughts',
      profile
    )
    // Golden test: if this changes, the derivation behavior changed.
    expect(password).toBe('3AGcdvd-FLDl4)ck')
  })
})
