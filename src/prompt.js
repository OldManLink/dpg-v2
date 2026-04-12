import readline from 'node:readline'

/**
 * @returns {Promise<string>}
 */
export function promptForMasterPassword() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const onData = char => {
      char = char + ''
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdout.write('\n')
          break
        default:
          readline.cursorTo(process.stdout, 0)
          process.stdout.write('Master password: ' + '*'.repeat(rl.line.length))
          break
      }
    }

    process.stdin.on('data', onData)

    rl.question('Master password: ', answer => {
      process.stdin.removeListener('data', onData)
      rl.close()
      resolve(answer)
    })

    rl.on('SIGINT', () => {
      process.stdin.removeListener('data', onData)
      rl.close()
      reject(new Error('Prompt cancelled'))
    })
  })
}
