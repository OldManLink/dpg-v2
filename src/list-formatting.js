/** @typedef {import('./models.js').Profile} Profile */
/** @typedef {import('./models.js').ProfileSortField} ProfileSortField */

/**
 * @param {Profile[]} profiles
 * @param {ProfileSortField=} sortBy
 * @returns {string}
 */
export function formatProfileList(profiles, sortBy = 'label') {
  const sorted = [...profiles]

  if (sortBy === 'label') {
    sorted.sort((a, b) => a.label.localeCompare(b.label))
  } else {
    // Defensive fallback for future values not yet implemented in list formatting.
    sorted.sort((a, b) => a.label.localeCompare(b.label))
  }

  const labelWidth = Math.max(
    'label'.length,
    ...sorted.map(p => p.label.length),
    0
  )

  /**
   * @param {string} str
   * @param {number} width
   * @returns {string}
   */
  const pad = (str, width) => str.padEnd(width, ' ')

  const lines = []
  lines.push(`${pad('label', labelWidth)}  counter`)

  for (const p of sorted) {
    lines.push(`${pad(p.label, labelWidth)}  ${p.counter}`)
  }

  return lines.join('\n')
}
