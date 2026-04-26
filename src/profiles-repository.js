import { loadAllProfiles, saveProfiles } from './profiles-file.js'
/** @typedef {import('./models.js').Profile} Profile */

export class ProfilesRepository {
  /**
   * @param {Profile[]} profiles
   * @param {{ saveProfiles?: (profiles: Profile[]) => Promise<void> }} [deps]
   */
  constructor(profiles, deps = {}) {
    this._profiles = [...profiles]
    this._saveProfiles = deps.saveProfiles ?? saveProfiles
  }

  /**
   * @param {{ loadAllProfiles?: () => Promise<Profile[]>, saveProfiles?: (profiles: Profile[]) => Promise<void> }} [deps]
   * @returns {Promise<ProfilesRepository>}
   */
  static async load(deps = {}) {
    const load = deps.loadAllProfiles ?? loadAllProfiles
    const profiles = await load()

    return new ProfilesRepository(profiles, deps)
  }

  /**
   * @returns {Profile[]}
   */
  list() {
    return [...this._profiles]
  }

  /**
   * @param {string} label
   * @returns {Profile|null}
   */
  get(label) {
    return this._profiles.find(p => p.label === label) ?? null
  }

  /**
   * @param {Profile} profile
   */
  create(profile) {
    this._profiles.push(profile)
  }

  /**
   * @param {Profile} profile
   */
  replace(profile) {
    const i = this._profiles.findIndex(p => p.label === profile.label)
    this._profiles[i] = profile
  }

  /**
   * @param {string} label
   */
  delete(label) {
    this._profiles = this._profiles.filter(p => p.label !== label)
  }

  /**
   * @returns {Promise<void>}
   */
  async persist() {
    await this._saveProfiles(this._profiles)
  }
}
