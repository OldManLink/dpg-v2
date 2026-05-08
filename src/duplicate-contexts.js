
/**
 * @param {string[]} labels
 * @returns string
 */
export function formatDuplicateDerivedPasswordWarning(labels){
  return `Warning: profiles derive the same password: ${labels.join(', ')}`
}

/**
 * @param {string[][]} labelGroups
 * @returns string
 */
export function formatDuplicateDerivedPasswordWarnings(labelGroups){
  return labelGroups
    .map(formatDuplicateDerivedPasswordWarning)
    .join('\n')
}
