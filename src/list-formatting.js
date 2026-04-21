/**
 * @typedef {import('./models.js').Profile} Profile
 */

/**
 * @param {Profile[]} profiles
 * @returns {string}
 */
export function formatProfileList(profiles) {
  const sorted = [...profiles].sort((a, b) =>
    a.label.localeCompare(b.label)
  )

  const labelWidth = Math.max(
    'label'.length,
    ...sorted.map(p => p.label.length),
    0
  )

  const pad = (str, width) => str.padEnd(width, ' ')

  const lines = []

  // header
  lines.push(`${pad('label', labelWidth)}  counter`)

  // rows
  for (const p of sorted) {
    lines.push(`${pad(p.label, labelWidth)}  ${p.counter}`)
  }

  return lines.join('\n')
}
