import { describe, it, expect } from 'vitest'
import { parseArgs } from '../src/cli-args.js'

describe('parseArgs', () => {
  it('parses -p <label>', () => {
    expect(parseArgs(['-p', 'github-main'])).toEqual({
      profileLabel: 'github-main',
      show: false,
      help: false,
      bump: null,
      list: false,
      save: false
    })
  })

  it('parses --profile <label> --show', () => {
    expect(parseArgs(['--profile', 'github-main', '--show'])).toEqual({
      profileLabel: 'github-main',
      show: true,
      help: false,
      bump: null,
      list: false,
      save: false
    })
  })

  it('parses --help', () => {
    expect(parseArgs(['--help'])).toEqual({
      profileLabel: null,
      show: false,
      help: true,
      bump: null,
      list: false,
      save: false
    })
  })

  it('parses -b <label>', () => {
    expect(parseArgs(['-b', 'github-main'])).toEqual({
      profileLabel: null,
      show: false,
      help: false,
      list: false,
      bump: 'github-main',
      save: false
    })
  })

  it('parses --bump <label> --save --show', () => {
    expect(parseArgs(['--bump', 'github-main', '--save', '--show'])).toEqual({
      profileLabel: null,
      show: true,
      help: false,
      list: false,
      bump: 'github-main',
      save: true
    })
  })

  it('throws if profile label is missing', () => {
    expect(() => parseArgs(['-p'])).toThrow(/profile label/i)
  })

  it('throws on unknown argument', () => {
    expect(() => parseArgs(['--wat'])).toThrow(/unknown argument/i)
  })
})
