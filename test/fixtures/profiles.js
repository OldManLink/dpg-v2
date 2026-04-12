export const FULL_PROFILE = {
  version: 'dpg:v2',
  service: 'github.com',
  account: 'peter@example.com',
  counter: 1,
  length: 20,
  require: ['lower', 'upper', 'digit', 'symbol'],
  symbolSet: '!@#'
}

export function makeProfile(overrides = {}) {
  return {
    ...FULL_PROFILE,
    ...overrides
  }
}
