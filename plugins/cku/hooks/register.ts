import type { Register } from 'claude-code'

const MARKETPLACE = 'claude-kit'

type Installed = { id: string; scope: string }
type Marketplace = { name: string; installLocation: string }
type Catalog = { plugins: { name: string }[] }

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'cku',
      description: 'Sync claude-kit plugins: install new, remove gone, update the rest',
      immediate: true,
    })

    return next(e)
  })

  // Pulls the marketplace, then makes the installed claude-kit plugins match its
  // catalog, then /reload-plugins. Reports through toasts only.
  on('command.run', { command: 'cku' }, async $ => {
    const run = async (...argv: string[]) => {
      const { exitCode, stdout, stderr } = await $.process.run(argv, { timeoutMs: 120_000 })
      if (exitCode !== 0) throw new Error(`${argv.join(' ')}: ${(stderr || stdout).trim()}`)
      return stdout
    }
    const claude = (...args: string[]) => run('claude', 'plugin', ...args)

    try {
      $.ui.toast('Syncing claude-kit…')
      await claude('marketplace', 'update', MARKETPLACE)

      const markets = JSON.parse(await claude('marketplace', 'list', '--json')) as Marketplace[]
      const dir = markets.find(m => m.name === MARKETPLACE)?.installLocation
      if (!dir) throw new Error(`marketplace ${MARKETPLACE} isn't added`)
      const catalog = JSON.parse(await run('cat', `${dir}/.claude-plugin/marketplace.json`)) as Catalog
      const wanted = new Set(catalog.plugins.map(p => p.name))

      const installed = (JSON.parse(await claude('list', '--json')) as Installed[])
        .filter(p => p.id.endsWith(`@${MARKETPLACE}`))
      const have = new Set(installed.map(p => p.id.split('@')[0]))

      const added: string[] = []
      const removed: string[] = []
      const updated: string[] = []
      for (const p of installed) {
        const name = p.id.split('@')[0]
        if (wanted.has(name)) {
          await claude('update', p.id, '--scope', p.scope)
          updated.push(name)
        } else {
          await claude('uninstall', p.id, '--scope', p.scope)
          removed.push(name)
        }
      }
      for (const name of wanted) {
        if (have.has(name)) continue
        await claude('install', `${name}@${MARKETPLACE}`, '--scope', 'user')
        added.push(name)
      }

      const parts = [
        added.length && `+${added.join(' +')}`,
        removed.length && `-${removed.join(' -')}`,
        updated.length && `updated ${updated.join(', ')}`,
      ].filter(Boolean)
      $.ui.toast(`claude-kit: ${parts.join(' · ') || 'nothing installed'}, reloading…`)
      // A command can't run another command from inside its own hook, so the
      // reload goes on a timer that fires once this one has returned.
      $.clock.after(0, () => void $.command.run({ command: 'reload-plugins', args: '' }))
    } catch (err) {
      $.ui.toast(`cku failed: ${err instanceof Error ? err.message : String(err)}`)
    }

    return {}
  })
}
