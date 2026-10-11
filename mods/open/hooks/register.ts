import type { Register } from 'claude-code'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'open',
      description: 'Open this directory in VS Code',
      immediate: true,
    })

    return next(e)
  })

  // Runs `code` directly: no model turn, works mid-turn.
  on('command.run', { command: 'open' }, async $ => {
    const dir = await $.session.cwd()
    const { exitCode, stderr } = await $.process.run(['code', dir], { timeoutMs: 15_000 })

    return exitCode === 0
      ? { text: `Opened ${dir} in VS Code` }
      : { text: `code exited ${exitCode}: ${stderr.trim()}` }
  })
}
