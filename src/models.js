/**
 * @typedef {'lower' | 'upper' | 'digit' | 'symbol'} RequireClass
 */

/**
 * @typedef {'label' | 'service' | 'createdAt' | 'updatedAt' | 'counter'} ProfileSortField
 */

/**
 * @typedef {{
 *   version: string,
 *   label: string,
 *   service: string,
 *   account?: string,
 *   counter: number,
 *   length: number,
 *   require: RequireClass[],
 *   symbolSet?: string,
 *   notes?: string,
 *   createdAt?: string,
 *   updatedAt?: string
 * }} Profile
 */

/**
 * @typedef {{
 *   length: number,
 *   require: string[],
 *   symbolSet?: string
 * }} PasswordPolicyInput
 */

/**
 * @typedef {{
 *   timeout?: number,
 *   sortBy?: ProfileSortField
 * }} Config
 */

/**
 * @typedef {{
 *   profileLabel: string | null,
 *   show: boolean,
 *   help: boolean,
 *   list: boolean,
 *   bump: string | null,
 *   save: boolean,
 *   create: string | null,
 *   deleteLabel: string | null,
 *   showProfileLabel: string | null
 * }} CliArgs
 */

/**
 * @typedef {{
 *   loadProfileByLabel?: (label: string) => Promise<Profile>,
 *   loadAllProfiles?: () => Promise<Profile[]>,
 *   saveProfiles?: (profiles: Profile[]) => Promise<void>,
 *   promptForMasterPassword?: () => Promise<string>,
 *   promptForConfirmation?: (prompt: string) => Promise<string>,
 *   generatePassword?: (master: string, profile: Profile) => Promise<string>,
 *   copyToClipboard?: (text: string) => Promise<void>,
 *   stdout?: { write: (s: string) => void },
 *   stderr?: { write: (s: string) => void }
 * }} CliDeps
 */

/**
 * @typedef {{
 *   stdin: { end: (text: string) => void },
 *   on: (event: 'error' | 'close', handler: (value: any) => void) => void
 * }} ClipboardChildProcess
 */

/**
 * @typedef {(command: string, args: string[], options: object) => ClipboardChildProcess} ClipboardSpawn
 */

/**
 * @typedef {{ command: string, args: string[] }} ClipboardCommand
 */

/**
 * @typedef {{
 *   platform?: string,
 *   hasCommand?: (name: string) => boolean
 * }} ClipboardEnvironment
 */

/**
 * @typedef {ClipboardEnvironment & {
 *   spawn?: ClipboardSpawn
 * }} ClipboardOptions
 */

export {}
