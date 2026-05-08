/** @typedef {import('./models.js').Profile} Profile */
/** @typedef {import('./models.js').ProfileEditField} ProfileEditField */
/** @typedef {import('./models.js').EditableProfileFields} EditableProfileFields */

import {canonicalRequire, canonicalSymbolSet} from "./profile-validation.js";

/**
 * @param {Profile} profile
 * @returns {EditableProfileFields}
 */
export function extractEditableProfileFields(profile){
  const service = profile.service
  const account = profile.account
  const counter = profile.counter
  const length = profile.length
  const require = profile.require
  const symbolSet = profile.symbolSet
  return { service, account, counter, length, require, symbolSet }
}

/**
 * @param {Profile} original
 * @param {EditableProfileFields} edited
 * @returns {Profile}
 */
export function mergeEditableProfileFields(original, edited){
  const requiresSymbolSet = edited.require && edited.require.includes('symbol')
  return {
    ...original,
    ...edited,
    require: canonicalRequire(edited.require),
    symbolSet: requiresSymbolSet ? canonicalSymbolSet(edited.symbolSet) : undefined
  }
}

/** @type ProfileEditField[] */
const EDITABLE_FIELDS = [
  'service',
  'account',
  'counter',
  'length',
  'require',
  'symbolSet'
]

/**
 * @param {Profile} original
 * @param {EditableProfileFields} edited
 * @returns {string[]}
 */
export function diffChangedEditableFields(original, edited) {
  /** @type ProfileEditField[] */
  const changed = []

  /**
   * @param {ProfileEditField} field
   * @param {any} value
   * @returns {any}
   */
  function normalizeEditableValue(field, value) {
    if ((field === 'account' || field === 'symbolSet') && value === '') {
      return undefined
    }
    return value
  }

  for (const field of EDITABLE_FIELDS) {
    const before = normalizeEditableValue(field, original[field])
    const after = normalizeEditableValue(field, edited[field])

    const isEqual = Array.isArray(before) && Array.isArray(after)
      ? before.length === after.length && before.every((v, i) => v === after[i])
      : before === after

    if (!isEqual) {
      changed.push(field)
    }
  }

  return changed
}

/**
 * @param {EditableProfileFields} edited
 * @returns {void}
 */
export function validateEditableProfileFields(edited) {
  if (typeof edited.service !== 'string' || edited.service.trim() === '') {
    throw new Error('Invalid service')
  }

  if (edited.account !== undefined && typeof edited.account !== 'string') {
    throw new Error('Invalid account')
  }

  if (!Number.isInteger(edited.counter) || edited.counter < 0) {
    throw new Error('Invalid counter')
  }

  if (!Number.isInteger(edited.length) || edited.length <= 0) {
    throw new Error('Invalid length')
  }

  if (edited.require) {
    canonicalRequire(edited.require)
  }

  if (edited.require && edited.require.includes('symbol')) {
    canonicalSymbolSet(edited.symbolSet)
  }
}
