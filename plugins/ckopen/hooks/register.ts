import type { EngineInterface as Engine, Register } from 'claude-code'

const message = (err: unknown) => (err instanceof Error ? err.message : String(err))

const command = async ($: Engine, ...argv: string[]) =>
  (await $.env.get('OS')) === 'Windows_NT' ? ['cmd', '/c', ...argv] : argv

const openInVsCode = async ($: Engine) => {
  const dir = await $.session.cwd()
  const argv = await command($, 'code', dir)
  const { exitCode, stderr } = await $.process.run(argv, { timeoutMs: 15_000 })
  return exitCode === 0 ? `Opened ${dir} in VS Code` : `code exited ${exitCode}: ${stderr.trim()}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'ckopen',
      description: 'Open this directory in VS Code',
      immediate: true,
    })
    return next(e)
  })

  on('command.run', { command: 'ckopen' }, async $ => {
    try {
      $.ui.toast(await openInVsCode($))
    } catch (err) {
      $.ui.toast(`Couldn't run code: ${message(err)}`)
    }
    return {}
  })
}
