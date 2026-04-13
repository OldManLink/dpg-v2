export function makeCliArgs(overrides = {}) {
  return {
    profileLabel: null,
    show: false,
    help: false,
    list: false,
    bump: null,
    save: false,
    ...overrides
  }
}
