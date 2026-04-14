import readline from 'node:readline'

/**
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export function promptForConfirmation(prompt) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question(prompt, answer => {
      rl.close()
      resolve(answer)
    })

    rl.on('SIGINT', () => {
      rl.close()
      reject(new Error('Prompt cancelled'))
    })
  })
}
