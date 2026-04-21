import {describe, expect, it} from 'vitest'
import {parseArgs} from '../src/cli-args.js'
import {makeCliArgs} from "./fixtures/cli.js";

describe('parseArgs', () => {
  it('parses -p <label>', () => {
    expect(parseArgs(['-p', 'github-main'])).toEqual(makeCliArgs({profileLabel: 'github-main'}))
  })

  it('parses --profile <label> --show', () => {
    expect(parseArgs(['--profile', 'github-main', '--show'])).toEqual(makeCliArgs({profileLabel: 'github-main', show: true}))
  })

  it('parses -n <label>', () => {
    expect(parseArgs(['-n', 'github-main'])).toEqual(makeCliArgs({create: 'github-main'}))
  })

  it('parses --new <label>', () => {
    expect(parseArgs(['--new', 'github-main'])).toEqual(makeCliArgs({create: 'github-main'}))
  })

  it('parses -D <label>', () => {
    expect(parseArgs(['-D', 'github-main'])).toEqual(makeCliArgs({deleteLabel: 'github-main'}))
  })

  it('parses --delete <label>', () => {
    expect(parseArgs(['--delete', 'github-main'])).toEqual(makeCliArgs({deleteLabel: 'github-main'}))
  })

  it('parses -b <label>', () => {
    expect(parseArgs(['-b', 'github-main'])).toEqual(makeCliArgs({bump: 'github-main'}))
  })

  it('parses --bump <label> --save --show', () => {
    expect(parseArgs(['--bump', 'github-main', '--save', '--show'])).toEqual(makeCliArgs({show: true, bump: 'github-main', save: true}))
  })

  it('parses --show-profile <label>', () => {
    expect(parseArgs(['--show-profile', 'github-main'])).toEqual(makeCliArgs({showProfileLabel: 'github-main'}))
  })

  it('parses --help', () => {
    expect(parseArgs(['--help'])).toEqual(makeCliArgs({help: true}))
  })

  it('parses --config with no argument as show-config', () => {
    expect(parseArgs(['--config'])).toEqual(makeCliArgs({configPresent: true}))
  })

  it('parses --config key=value', () => {
    expect(parseArgs(['--config', 'timeout=900'])).toEqual(makeCliArgs({configPresent: true, configArg: 'timeout=900'}))
  })

  it('parses -c key=value', () => {
    expect(parseArgs(['-c', 'sortBy=label'])).toEqual(makeCliArgs({configPresent: true, configArg: 'sortBy=label'}))
  })

  it('parses -c --list', () => {
    expect(parseArgs(['-c', '--list'])).toEqual(makeCliArgs({configPresent: true, list: true}))
  })

  it('throws if config argument is not in the form "key=value"', () => {
    expect(() => parseArgs(['-c', 'fubar'])).toThrow(/key=value/i)
  })

  it('throws if profile label is missing after -p/--profile', () => {
    expect(() => parseArgs(['-p'])).toThrow(/missing profile label/i)
    expect(() => parseArgs(['--profile'])).toThrow(/missing profile label/i)
  })

  it('throws if label is missing after -b/--bump', () => {
    expect(() => parseArgs(['-b'])).toThrow(/missing/i)
    expect(() => parseArgs(['--bump'])).toThrow(/missing/i)
  })

  it('throws if label is missing after -n/--new', () => {
    expect(() => parseArgs(['-n'])).toThrow(/missing profile label/i)
    expect(() => parseArgs(['--new'])).toThrow(/missing profile label/i)
  })

  it('throws if label is missing after -D/--delete', () => {
    expect(() => parseArgs(['-D'])).toThrow(/missing profile label/i)
    expect(() => parseArgs(['--delete'])).toThrow(/missing profile label/i)
  })

  it('throws if label is missing after --show-profile', () => {
    expect(() => parseArgs(['--show-profile'])).toThrow(/missing profile label/i)
  })

  it('throws on unknown long flag', () => {
    expect(() => parseArgs(['--shwo'])).toThrow(/unknown/i)
  })

  it('throws on unknown short flag', () => {
    expect(() => parseArgs(['-z'])).toThrow(/unknown/i)
  })
})
