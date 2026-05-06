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
    const save = deps.saveProfiles ?? saveProfiles

    const profiles = await load()

    return new ProfilesRepository(profiles, {
      saveProfiles: save
    })
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
    if (this.get(profile.label)) {
      throw new Error(`Profile already exists: '${profile.label}'`)
    }

    this._profiles.push(profile)
  }

  /**
   * @param {Profile} profile
   */
  replace(profile) {
    const i = this._profiles.findIndex(p => p.label === profile.label)

    if (i === -1) {
      throw new Error(`Profile does not exist: '${profile.label}'`)
    }

    this._profiles[i] = profile
  }

  /**
   * @param {string} label
   */
  delete(label) {
    const i = this._profiles.findIndex(p => p.label === label)

    if (i === -1) {
      throw new Error(`Profile does not exist: '${label}'`)
    }

    this._profiles = this._profiles.filter(p => p.label !== label)
  }

  /**
   * @returns {Promise<void>}
   */
  async persist() {
    await this._saveProfiles(this._profiles)
  }
}
