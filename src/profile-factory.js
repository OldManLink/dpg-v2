import { validateProfileLabel } from './profile-validation.js'

export const DEFAULT_REQUIRE = ['lower', 'upper', 'digit', 'symbol']
export const DEFAULT_SYMBOL_SET = '!@#'
/**
 * @param {string} label
 * @param {string=} now
 */
export function createDefaultProfile(label, now = new Date().toISOString()) {
  validateProfileLabel(label)

  return {
    version: 'dpg:v2',
    label,
    service: label,
    counter: 0,
    length: 20,
    require: DEFAULT_REQUIRE,
    symbolSet: DEFAULT_SYMBOL_SET,
    createdAt: now,
    updatedAt: now
  }
}
