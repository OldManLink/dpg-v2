import {canonicalSymbolSet, REQUIRE_CLASS_ORDER, validateProfileLabel} from './profile-validation.js'
/** @typedef {import('./models.js').RequireClass} RequireClass */

/** @type RequireClass[] */
export const DEFAULT_REQUIRE = [...REQUIRE_CLASS_ORDER]
export const DEFAULT_SYMBOL_SET = canonicalSymbolSet('@!#')

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
