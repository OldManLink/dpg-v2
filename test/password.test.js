import { describe, it, expect } from 'vitest'
import { generatePasswordFromSiteKey } from '../src/password.js'
import {makeProfile} from "./fixtures/profiles.js";

function fixedSiteKey() {
  return new Uint8Array(32).fill(11)
}

describe('generatePasswordFromSiteKey', () => {
  it('generates a password of the requested length', () => {
    const password = generatePasswordFromSiteKey(fixedSiteKey(), makeProfile({
      length: 16,
      require: ['lower', 'upper', 'digit', 'symbol'],
      symbolSet: '!@#'
    }))

    expect(password).toHaveLength(16)
  })

  it('is deterministic for the same site key and profile', () => {
    const profile = makeProfile({
      length: 20,
      require: ['lower', 'upper', 'digit', 'symbol'],
      symbolSet: '!@#'
    })

    const a = generatePasswordFromSiteKey(fixedSiteKey(), profile)
    const b = generatePasswordFromSiteKey(fixedSiteKey(), profile)

    expect(a).toBe(b)
  })

  it('contains at least one character from each required class', () => {
    const password = generatePasswordFromSiteKey(fixedSiteKey(), makeProfile({
      length: 24,
      require: ['lower', 'upper', 'digit', 'symbol'],
      symbolSet: '!@#'
    }))

    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[!@#]/)
  })

  it('uses only allowed characters', () => {
    const password = generatePasswordFromSiteKey(fixedSiteKey(), makeProfile({
      length: 50,
      require: ['lower', 'digit'],
      symbolSet: '!@#'
    }))

    expect(password).toMatch(/^[a-z0-9]+$/)
  })

  it('throws if length is less than number of required classes', () => {
    expect(() =>
      generatePasswordFromSiteKey(fixedSiteKey(), makeProfile({
        length: 2,
        require: ['lower', 'upper', 'digit'],
        symbolSet: '!@#'
      }))
    ).toThrow(/length/i)
  })

  it('throws if no character classes are enabled', () => {
    expect(() =>
      generatePasswordFromSiteKey(fixedSiteKey(), makeProfile({
        length: 10,
        require: [],
        symbolSet: '!@#'
      }))
    ).toThrow(/character class|alphabet/i)
  })

  it('throws on unknown character class', () => {

    expect(() =>
      generatePasswordFromSiteKey(fixedSiteKey(), makeProfile({
        length: 10,
        // @ts-ignore - intentional invalid RequireClass to test runtime validation
        require: ['runes', 'lower'],
        symbolSet: '!@#'
      }))
    ).toThrow(/unknown/i)
  })

  it('defaults symbolSet when symbols are required', () => {
    const password = generatePasswordFromSiteKey(fixedSiteKey(), makeProfile({
      length: 20,
      require: ['symbol']
    }))

    expect(password).toHaveLength(20)
  })

})
