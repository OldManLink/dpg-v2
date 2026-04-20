import { describe, it, expect, vi } from 'vitest'
import { getClipboardCommand, copyToClipboard } from '../src/clipboard.js'
/** @typedef {import('../src/models.js').ClipboardChildProcess} ClipboardChildProcess */

describe('getClipboardCommand', () => {
  it('uses pbcopy on macOS', () => {
    expect(getClipboardCommand({
      platform: 'darwin',
      hasCommand: () => true
    })).toEqual({ command: 'pbcopy', args: [] })
  })

  it('uses clip on Windows', () => {
    expect(getClipboardCommand({
      platform: 'win32',
      hasCommand: () => true
    })).toEqual({ command: 'clip', args: [] })
  })

  it('prefers wl-copy on Linux', () => {
    expect(getClipboardCommand({
      platform: 'linux',
      hasCommand: name => name === 'wl-copy'
    })).toEqual({ command: 'wl-copy', args: [] })
  })

  it('falls back to xclip on Linux', () => {
    expect(getClipboardCommand({
      platform: 'linux',
      hasCommand: name => name === 'xclip'
    })).toEqual({ command: 'xclip', args: ['-selection', 'clipboard'] })
  })

  it('falls back to xsel on Linux', () => {
    expect(getClipboardCommand({
      platform: 'linux',
      hasCommand: name => name === 'xsel'
    })).toEqual({ command: 'xsel', args: ['--clipboard', '--input'] })
  })

  it('throws if no clipboard tool is available on Linux', () => {
    expect(() => getClipboardCommand({
      platform: 'linux',
      hasCommand: () => false
    })).toThrow(/clipboard/i)
  })
})

describe('copyToClipboard', () => {
  it('writes to the selected clipboard process stdin', async () => {
    const end = vi.fn()
    const spawn = vi.fn(() => /** @type {ClipboardChildProcess} */ ({
      stdin: { end },
      on: (event, handler) => {
        if (event === 'close') handler(0)
      }
    }))

    await copyToClipboard('secret', {
      platform: 'darwin',
      hasCommand: () => true,
      spawn
    })

    expect(spawn).toHaveBeenCalledWith('pbcopy', [], expect.any(Object))
    expect(end).toHaveBeenCalledWith('secret')
  })
})
