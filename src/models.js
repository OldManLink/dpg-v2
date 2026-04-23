/**
 * @typedef {'lower' | 'upper' | 'digit' | 'symbol'} RequireClass
 */

/**
 * @typedef {'label' | 'service' | 'createdAt' | 'updatedAt' | 'counter'} ProfileSortField
 */

/**
 * @typedef {'service' | 'account' | 'counter' | 'length' | 'require' | 'symbolSet' } ProfileEditField
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
 *   service: string,
 *   account?: string,
 *   counter: number,
 *   length: number,
 *   require: RequireClass[],
 *   symbolSet?: string
 * }} EditableProfileFields
 */

/**
 * @typedef {{
 *   timeout?: number,
 *   sortBy?: ProfileSortField,
 *   editor?: string
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
 *   showProfileLabel: string | null,
 *   configPresent: boolean,
 *   configArg: string | null
 *   editLabel: string | null
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
 *   readTempFile?: (filePath: string) => Promise<string>,
 *   writeTempFile?: (label: string, content: string) => Promise<string>,
 *   deleteTempFile?: (filePath: string) => Promise<void>,
 *   openInEditor?: (editor: string, filePath: string) => Promise<number>,
 *   loadConfig?: () => Promise<Config>,
 *   saveConfig?: (config: Config) => Promise<void>,
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

/**
 * @typedef {typeof import('node:child_process').spawn} EditorSpawn
 */

export {}
