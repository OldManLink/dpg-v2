const PROFILE_LABEL_RE = /^[A-Za-z0-9._-]+$/

/**
 * @param {string} label
 * @returns {true}
 */
export function validateProfileLabel(label) {
  if (!label || !PROFILE_LABEL_RE.test(label)) {
    throw new Error(
      `Invalid profile label: '${label}'. Labels may contain only letters, digits, dot, underscore, and hyphen.`
    )
  }

  return true
}
