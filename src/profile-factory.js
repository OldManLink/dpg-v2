import { validateProfileLabel } from './profile-validation.js'

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
    require: ['lower', 'upper', 'digit', 'symbol'],
    symbolSet: '!@#',
    createdAt: now,
    updatedAt: now
  }
}
