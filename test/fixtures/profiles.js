export const DEFAULT_PROFILE = {
  version: 'dpg:v2',
  label: 'github-main',
  service: 'github.com',
  account: 'peter@example.com',
  counter: 1,
  length: 20,
  require: ['lower', 'upper', 'digit', 'symbol'],
  symbolSet: '!@#'
}

export function makeProfile(overrides = {}) {
  return {
    ...DEFAULT_PROFILE,
    ...overrides
  }
}
