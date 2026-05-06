import { describe, it, expect, vi } from 'vitest'
import {makeProfile} from "./fixtures/profiles.js";
import {
  findDuplicateDerivedPasswordGroups, formatDuplicateDerivedPasswordWarning,
  formatDuplicateDerivedPasswordWarnings
} from "../src/duplicate-contexts.js";

describe('duplicate contexts', () => {
  it('detects two profiles with identical canonical contexts', () => {
    const profiles = [
      makeProfile({label: 'github-home', service: 'github.com', counter: 1}),
      makeProfile({label: 'github-work', service: 'github.com', counter: 1})
    ]

    expect(findDuplicateDerivedPasswordGroups(profiles)).toEqual([
      ['github-home', 'github-work']
    ])
  })

  it('detects three profiles with identical canonical contexts', () => {
    const profiles = [
      makeProfile({label: 'a', service: 'same', counter: 1}),
      makeProfile({label: 'b', service: 'same', counter: 1}),
      makeProfile({label: 'c', service: 'same', counter: 1})
    ]

    expect(findDuplicateDerivedPasswordGroups(profiles)).toEqual([
      ['a', 'b', 'c']
    ])
  })

  it('does not report profiles with different canonical contexts', () => {
    const profiles = [
      makeProfile({label: 'a', service: 'a.example', counter: 1}),
      makeProfile({label: 'b', service: 'b.example', counter: 1})
    ]

    expect(findDuplicateDerivedPasswordGroups(profiles)).toEqual([])
  })

  it('confirms duplicates by comparing canonical contexts within ctxHash buckets', () => {
    const profiles = [
      makeProfile({label: 'a', service: 'a.example', ctxHash: 'forced-collision'}),
      makeProfile({label: 'b', service: 'b.example', ctxHash: 'forced-collision'})
    ]

    expect(findDuplicateDerivedPasswordGroups(profiles)).toEqual([])
  })

  it('uses labels in deterministic order', () => {
    const profiles = [
      makeProfile({label: 'zeta', service: 'same'}),
      makeProfile({label: 'alpha', service: 'same'})
    ]

    expect(findDuplicateDerivedPasswordGroups(profiles)).toEqual([
      ['alpha', 'zeta']
    ])
  })

  it('formats duplicate warning for two profiles', () => {
    expect(formatDuplicateDerivedPasswordWarning(['github-home', 'github-work']))
      .toBe('Warning: profiles derive the same password: github-home, github-work')
  })

  it('formats duplicate warning for three profiles', () => {
    expect(formatDuplicateDerivedPasswordWarning(['a', 'b', 'c']))
      .toBe('Warning: profiles derive the same password: a, b, c')
  })

  it('formats multiple duplicate groups as separate warnings', () => {
    expect(formatDuplicateDerivedPasswordWarnings([
      ['a', 'b'],
      ['x', 'y', 'z']
    ])).toBe(
      'Warning: profiles derive the same password: a, b\n' +
      'Warning: profiles derive the same password: x, y, z'
    )
  })
})
