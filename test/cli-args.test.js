import { describe, it, expect } from 'vitest'
import { parseArgs } from '../src/cli-args.js'

describe('parseArgs', () => {
  it('parses -p <label>', () => {
    expect(parseArgs(['-p', 'github-main'])).toEqual({
      profileLabel: 'github-main',
      show: false,
      help: false
    })
  })

  it('parses --profile <label> --show', () => {
    expect(parseArgs(['--profile', 'github-main', '--show'])).toEqual({
      profileLabel: 'github-main',
      show: true,
      help: false
    })
  })

  it('parses --help', () => {
    expect(parseArgs(['--help'])).toEqual({
      profileLabel: null,
      show: false,
      help: true
    })
  })

  it('throws if profile label is missing', () => {
    expect(() => parseArgs(['-p'])).toThrow(/profile label/i)
  })

  it('throws on unknown argument', () => {
    expect(() => parseArgs(['--wat'])).toThrow(/unknown argument/i)
  })
})
