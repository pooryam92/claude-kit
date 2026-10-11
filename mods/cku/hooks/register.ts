import type { Register } from 'claude-code'

const MARKETPLACE = 'claude-kit'

type Installed = { id: string; scope: string }

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'cku',
      description: 'Update all claude-kit mods and reload them',
      immediate: true,
    })

    return next(e)
  })

  // Same as running `claude plugin marketplace update` + `claude plugin update`
  // for each installed claude-kit mod, then /reload-plugins. Toasts only.
  on('command.run', { command: 'cku' }, async $ => {
    const claude = async (...args: string[]) => {
      const { exitCode, stdout, stderr } = await $.process.run(['claude', ...args], { timeoutMs: 120_000 })
      if (exitCode !== 0) throw new Error(`claude ${args.join(' ')}: ${(stderr || stdout).trim()}`)
      return stdout
    }

    try {
      $.ui.toast('Updating claude-kit…')
      await claude('plugin', 'marketplace', 'update', MARKETPLACE)
      const mine = (JSON.parse(await claude('plugin', 'list', '--json')) as Installed[])
        .filter(p => p.id.endsWith(`@${MARKETPLACE}`))
      for (const p of mine) await claude('plugin', 'update', p.id, '--scope', p.scope)
      $.ui.toast(`Updated ${mine.map(p => p.id.split('@')[0]).join(', ') || 'nothing'}, reloading…`)
      // A command can't run another command from inside its own hook, so the
      // reload goes on a timer that fires once this one has returned.
      $.clock.after(0, () => void $.command.run({ command: 'reload-plugins', args: '' }))
    } catch (err) {
      $.ui.toast(`cku failed: ${err instanceof Error ? err.message : String(err)}`)
    }

    return {}
  })
}
