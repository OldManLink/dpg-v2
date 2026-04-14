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
      save: false,
      create: null
    })
  })

  it('parses --profile <label> --show', () => {
    expect(parseArgs(['--profile', 'github-main', '--show'])).toEqual({
      profileLabel: 'github-main',
      show: true,
      help: false,
      bump: null,
      list: false,
      save: false,
      create: null
    })
  })

  it('parses -n <label>', () => {
    expect(parseArgs(['-n', 'github-main'])).toEqual({
      profileLabel: null,
      show: false,
      help: false,
      list: false,
      bump: null,
      save: false,
      create: 'github-main'
    })
  })

  it('parses --new <label>', () => {
    expect(parseArgs(['--new', 'github-main'])).toEqual({
      profileLabel: null,
      show: false,
      help: false,
      list: false,
      bump: null,
      save: false,
      create: 'github-main'
    })
  })

  it('throws if label is missing after -n/--new', () => {
    expect(() => parseArgs(['-n'])).toThrow(/label/i)
  })

  it('parses --help', () => {
    expect(parseArgs(['--help'])).toEqual({
      profileLabel: null,
      show: false,
      help: true,
      bump: null,
      list: false,
      save: false,
      create: null
    })
  })

  it('parses -b <label>', () => {
    expect(parseArgs(['-b', 'github-main'])).toEqual({
      profileLabel: null,
      show: false,
      help: false,
      list: false,
      bump: 'github-main',
      save: false,
      create: null
    })
  })

  it('parses --bump <label> --save --show', () => {
    expect(parseArgs(['--bump', 'github-main', '--save', '--show'])).toEqual({
      profileLabel: null,
      show: true,
      help: false,
      list: false,
      bump: 'github-main',
      save: true,
      create: null
    })
  })

  it('throws if profile label is missing', () => {
    expect(() => parseArgs(['-p'])).toThrow(/profile label/i)
  })

  it('throws on unknown argument', () => {
    expect(() => parseArgs(['--wat'])).toThrow(/unknown argument/i)
  })
})
