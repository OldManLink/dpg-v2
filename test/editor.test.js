import { describe, it, expect } from 'vitest'
import { splitCommand } from '../src/editor.js'

describe('splitCommand', () => {
  it('splits command with arguments', () => {
    expect(splitCommand('code --wait')).toEqual(['code', '--wait'])
  })

  it('keeps quoted executable path together', () => {
    expect(splitCommand('"C:\\Program Files\\Editor\\editor.exe" --wait')).toEqual([
      'C:\\Program Files\\Editor\\editor.exe',
      '--wait'
    ])
  })
})
