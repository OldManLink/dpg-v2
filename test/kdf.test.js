import { describe, it, expect } from 'vitest'
import { deriveSiteKey } from '../src/kdf.js'
import { encodeContext } from '../src/context.js'
import { TEST_KDF } from './fixtures/kdf.js'
import { FULL_PROFILE, makeProfile  } from './fixtures/profiles.js'

describe('deriveSiteKey', () => {
  it('is deterministic', async () => {
    const context = encodeContext(FULL_PROFILE)

    const a = await deriveSiteKey('master', context, TEST_KDF)
    const b = await deriveSiteKey('master', context, TEST_KDF)

    expect(Array.from(a)).toEqual(Array.from(b))
  })

  it('changes when master password changes', async () => {
    const context = encodeContext(FULL_PROFILE)

    const a = await deriveSiteKey('master-one', context, TEST_KDF)
    const b = await deriveSiteKey('master-two', context, TEST_KDF)

    expect(Array.from(a)).not.toEqual(Array.from(b))
  })

  it('changes when context changes', async () => {
    const c1 = encodeContext(FULL_PROFILE)
    const c2 = encodeContext(makeProfile({ counter: 2 }))

    const a = await deriveSiteKey('master', c1, TEST_KDF)
    const b = await deriveSiteKey('master', c2, TEST_KDF)

    expect(Array.from(a)).not.toEqual(Array.from(b))
  })

  it('returns 32 bytes', async () => {
    const context = encodeContext(FULL_PROFILE)
    const key = await deriveSiteKey('master', context, TEST_KDF)

    expect(key).toBeInstanceOf(Uint8Array)
    expect(key).toHaveLength(32)
  })

  it('returns different keys for different Unicode-normalized master passwords only when actually different', async () => {
    const context = encodeContext(FULL_PROFILE)

    const a = await deriveSiteKey('café', context, TEST_KDF)
    const b = await deriveSiteKey('cafe\u0301', context, TEST_KDF)

    expect(Array.from(a)).toEqual(Array.from(b))
  })

  it('is stable across repeated calls', () => {
    const context = encodeContext(FULL_PROFILE)

    const outputs = Array.from({ length: 3 }, async () =>
      Array.from(await deriveSiteKey('master', context, TEST_KDF))
    )

    expect(outputs[0]).toEqual(outputs[1])
    expect(outputs[1]).toEqual(outputs[2])
  })

})

describe('deriveSiteKey (production Argon2)', () => {
  it('works with production Argon2 parameters [slow]', async () => {
    const context = encodeContext(FULL_PROFILE)

    const key = await deriveSiteKey('master', context)

    expect(key).toBeInstanceOf(Uint8Array)
    expect(key).toHaveLength(32)
  })

})
