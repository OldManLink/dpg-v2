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
      create: null,
      deleteLabel: null,
      showProfileLabel: null
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
      create: null,
      deleteLabel: null,
      showProfileLabel: null
    })
  })

  it('throws if profile label is missing', () => {
    expect(() => parseArgs(['-p'])).toThrow(/profile label/i)
  })

  it('parses -n <label>', () => {
    expect(parseArgs(['-n', 'github-main'])).toEqual({
      profileLabel: null,
      show: false,
      help: false,
      list: false,
      bump: null,
      save: false,
      create: 'github-main',
      deleteLabel: null,
      showProfileLabel: null
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
      create: 'github-main',
      deleteLabel: null,
      showProfileLabel: null
    })
  })

  it('throws if label is missing after -n/--new', () => {
    expect(() => parseArgs(['-n'])).toThrow(/label/i)
  })

  it('parses -D <label>', () => {
    expect(parseArgs(['-D', 'github-main'])).toEqual({
      profileLabel: null,
      show: false,
      help: false,
      list: false,
      bump: null,
      save: false,
      create: null,
      deleteLabel: 'github-main',
      showProfileLabel: null
    })
  })

  it('parses --delete <label>', () => {
    expect(parseArgs(['--delete', 'github-main'])).toEqual({
      profileLabel: null,
      show: false,
      help: false,
      list: false,
      bump: null,
      save: false,
      create: null,
      deleteLabel: 'github-main',
      showProfileLabel: null
    })
  })

  it('throws if label is missing after -D/--delete', () => {
    expect(() => parseArgs(['-D'])).toThrow(/label/i)
  })

  it('parses -b <label>', () => {
    expect(parseArgs(['-b', 'github-main'])).toEqual({
      profileLabel: null,
      show: false,
      help: false,
      list: false,
      bump: 'github-main',
      save: false,
      create: null,
      deleteLabel: null,
      showProfileLabel: null
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
      create: null,
      deleteLabel: null,
      showProfileLabel: null
    })
  })

  it('parses --show-profile <label>', () => {
    expect(parseArgs(['--show-profile', 'github-main'])).toEqual({
      profileLabel: null,
      show: false,
      help: false,
      list: false,
      bump: null,
      save: false,
      create: null,
      deleteLabel: null,
      showProfileLabel: 'github-main'
    })
  })

  it('throws if label is missing after --show-profile', () => {
    expect(() => parseArgs(['--show-profile'])).toThrow(/label/i)
  })

  it('parses --help', () => {
    expect(parseArgs(['--help'])).toEqual({
      profileLabel: null,
      show: false,
      help: true,
      bump: null,
      list: false,
      save: false,
      create: null,
      deleteLabel: null,
      showProfileLabel: null
    })
  })

  it('throws on unknown argument', () => {
    expect(() => parseArgs(['--wat'])).toThrow(/unknown argument/i)
  })
})
