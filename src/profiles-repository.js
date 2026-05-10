import {loadAllProfiles, saveProfiles} from './profiles-file.js'
import {backfillCtxHashes, computeFullCtxHash, findRequiredHashAbbrev, withCtxHash} from "./context-hash.js";
import {encodeContext} from "./context.js";
import {loadConfig, saveConfig} from "./config-file.js";
/** @typedef {import('./models.js').Config} Config */
/** @typedef {import('./models.js').Profile} Profile */

export class ProfilesRepository {
  /**
   * @param {Profile[]} profiles
   * @param {{ saveProfiles?: (profiles: Profile[]) => Promise<void>, config?: Config, saveConfig?: (config: Config) => Promise<void> , findRequiredHashAbbrev?: () => number }} [deps]
   */
  constructor(profiles, deps = {}) {
    this._profiles = [...profiles]
    this._saveProfiles = deps.saveProfiles ?? saveProfiles
    this._config = deps.config
    this._saveConfig = deps.saveConfig ?? saveConfig
    this._findRequiredHashAbbrev = deps.findRequiredHashAbbrev ?? findRequiredHashAbbrev  }

  /**
   * @param {{ loadAllProfiles?: () => Promise<Profile[]>, loadConfig?: () => Promise<Config>, saveProfiles?: (profiles: Profile[]) => Promise<void>, saveConfig?: (config: Config) => Promise<void> }} [deps]
   * @returns {Promise<ProfilesRepository>}
   */
  static async load(deps = {}) {
    const load = deps.loadAllProfiles ?? loadAllProfiles
    const loadCfg = deps.loadConfig ?? loadConfig
    const save = deps.saveProfiles ?? saveProfiles
    const saveCfg = deps.saveConfig ?? saveConfig

    const config = await loadCfg()
    return new ProfilesRepository(backfillCtxHashes(await load(), config.hashAbbrev), {
      saveProfiles: save,
      config: config,
      saveConfig: saveCfg
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
    this._profiles.push(withCtxHash(profile, this._config.hashAbbrev))
  }

  /**
   * @param {Profile} profile
   */
  replace(profile) {
    const i = this._profiles.findIndex(p => p.label === profile.label)

    if (i === -1) {
      throw new Error(`Profile does not exist: '${profile.label}'`)
    }

    this._profiles[i] = withCtxHash(profile, this._config.hashAbbrev)
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
    const required = this._findRequiredHashAbbrev(this._profiles, this._config.hashAbbrev)

    if (required > this._config.hashAbbrev) {
      this._config = {
        ...this._config,
        hashAbbrev: required
      }

      this._profiles = this._profiles.map(profile => withCtxHash(profile, required))
      await this._saveConfig(this._config)
    }
    await this._saveProfiles(this._profiles)
  }

  /**
   * @returns {string[][]}
   */
  findDuplicateDerivedPasswordGroups(){
    /** @type {Map<string,Profile[]>}*/
    const buckets = new Map()

    for (const profile of this._profiles) {
      const hash = profile.ctxHash ?? computeFullCtxHash(profile)

      if (!buckets.has(hash)) {
        buckets.set(hash, [])
      }

      buckets.get(hash).push(profile)
    }

    /** @type {string[][]}*/
    const groups = []

    for (const bucket of buckets.values()) {
      if (bucket.length < 2) continue

      /** @type {Map<string, string[]>}*/
      const contextBuckets = new Map()

      for (const profile of bucket) {
        const contextKey = Buffer.from(encodeContext(profile)).toString('base64')

        if (!contextBuckets.has(contextKey)) {
          contextBuckets.set(contextKey, [])
        }

        contextBuckets.get(contextKey).push(profile.label)
      }

      for (const labels of contextBuckets.values()) {
        if (labels.length > 1) {
          groups.push([...labels].sort((a, b) => a.localeCompare(b)))
        }
      }
    }

    return groups.sort((a, b) => a[0].localeCompare(b[0]))
  }
}
