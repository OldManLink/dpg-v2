#!/usr/bin/env node

import { parseArgs } from './cli-args.js'
import { runCli } from './cli-runner.js'

async function main() {
  let args
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(message + '\n')
    process.exit(1)
  }

  const exitCode = await runCli(args)
  process.exit(exitCode)
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(message + '\n')
  process.exit(1)
})
