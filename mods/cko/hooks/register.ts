import type { Register } from 'claude-code'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'cko',
      description: 'Open this directory in VS Code',
      immediate: true,
    })

    return next(e)
  })

  // Runs `code` directly and reports through a toast, so neither the model
  // nor the transcript is involved. Works mid-turn.
  on('command.run', { command: 'cko' }, async $ => {
    const dir = await $.session.cwd()
    try {
      const { exitCode, stderr } = await $.process.run(['code', dir], { timeoutMs: 15_000 })
      $.ui.toast(exitCode === 0 ? `Opened ${dir} in VS Code` : `code exited ${exitCode}: ${stderr.trim()}`)
    } catch (err) {
      $.ui.toast(`Couldn't run code: ${err instanceof Error ? err.message : String(err)}`)
    }

    return {}
  })
}
