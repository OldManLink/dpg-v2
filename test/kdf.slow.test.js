import { describe, it, expect } from 'vitest'
import { deriveSiteKey } from '../src/kdf.js'
import { encodeContext } from '../src/context.js'
import { DEFAULT_PROFILE  } from './fixtures/profiles.js'

describe('deriveSiteKey (production Argon2)', () => {
  it('works with production Argon2 parameters [slow]', async () => {
    const context = encodeContext(DEFAULT_PROFILE)

    const key = await deriveSiteKey('master', context)

    expect(key).toBeInstanceOf(Uint8Array)
    expect(key).toHaveLength(32)
  })
})
