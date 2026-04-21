import { it, expect } from 'vitest'
import { formatProfileList } from '../src/list-formatting.js'
import { makeProfile } from './fixtures/profiles.js'
/** @typedef {import('../src/models.js').Profile} Profile */

it('formats profiles with aligned columns', () => {
  /** @type Profile[] */
  const profiles = [
    makeProfile({ label: 'github', counter: 12 }),
    makeProfile({ label: 'email', counter: 3 })
  ]

  const output = formatProfileList(profiles)

  expect(output).toContain('label')
  expect(output).toContain('counter')
  expect(output).toContain('github')
  expect(output).toContain('email')
})

it('aligns columns based on longest label', () => {
  /** @type Profile[] */
  const profiles = [
    makeProfile({ label: 'a', counter: 1 }),
    makeProfile({ label: 'long-label', counter: 2 })
  ]

  const output = formatProfileList(profiles)
  const lines = output.trim().split('\n')

  const header = lines[0]
  const row1 = lines[1]
  const row2 = lines[2]

  // counter column should start at same index
  const headerIndex = header.indexOf('counter')
  expect(row1.indexOf('1')).toBe(headerIndex)
  expect(row2.indexOf('2')).toBe(headerIndex)
})

it('sorts profiles by label', () => {
  /** @type Profile[] */
  const profiles = [
    makeProfile({ label: 'zeta', counter: 1 }),
    makeProfile({ label: 'alpha', counter: 2 })
  ]

  const output = formatProfileList(profiles)

  const lines = output.trim().split('\n')

  expect(lines[1]).toContain('alpha')
  expect(lines[2]).toContain('zeta')
})

it('prints header only when no profiles exist', () => {
  const output = formatProfileList([])

  const lines = output.trim().split('\n')

  expect(lines.length).toBe(1)
  expect(lines[0]).toContain('label')
  expect(lines[0]).toContain('counter')
})
