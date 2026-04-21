/** @typedef {import('../../src/models.js').CliArgs} CliArgs */

/**
 * @param {Partial<CliArgs>=} overrides
 * @returns {CliArgs}
 */
export function makeCliArgs(overrides = {}) {
  return {
    profileLabel: null,
    show: false,
    help: false,
    list: false,
    bump: null,
    save: false,
    create: null,
    deleteLabel: null,
    showProfileLabel: null,
    configPresent: false,
    configArg: null,
    ...overrides
  }
}
