export const ARGON2_PARAMS = Object.freeze({
  parallelism: 1,
  passes: 3,
  memorySize: 64 * 1024, // KiB = 64 MiB
  tagLength: 32
})
