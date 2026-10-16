import type { EngineInterface as Engine, Register } from 'claude-code'

const MARKETPLACE = 'claude-kit'

type Installed = { id: string; scope: string }
type Marketplace = { name: string; installLocation: string }
type Catalog = { plugins: { name: string }[] }
type Changes = { added: string[]; removed: string[]; updated: string[] }

const message = (err: unknown) => (err instanceof Error ? err.message : String(err))
const nameOf = (id: string) => id.split('@')[0] ?? id

const pluginCli = async ($: Engine) => {
  const windows = (await $.env.get('OS')) === 'Windows_NT'
  const run = async (...args: string[]) => {
    const argv = ['claude', 'plugin', ...args]
    const { exitCode, stdout, stderr } = await $.process.run(
      windows ? ['cmd', '/c', ...argv] : argv,
      { timeoutMs: 120_000 },
    )
    if (exitCode !== 0) throw new Error(`${argv.join(' ')}: ${(stderr || stdout).trim()}`)
    return stdout
  }
  const json = async <T>(...args: string[]) => JSON.parse(await run(...args, '--json')) as T
  return { run, json }
}

const catalogPlugins = async ($: Engine, cli: Awaited<ReturnType<typeof pluginCli>>) => {
  const markets = await cli.json<Marketplace[]>('marketplace', 'list')
  const dir = markets.find(m => m.name === MARKETPLACE)?.installLocation
  if (!dir) throw new Error(`marketplace ${MARKETPLACE} isn't added`)
  const catalog = JSON.parse(await $.fs.read(`${dir}/.claude-plugin/marketplace.json`)) as Catalog
  return new Set(catalog.plugins.map(p => p.name))
}

const sync = async ($: Engine): Promise<Changes> => {
  const cli = await pluginCli($)
  await cli.run('marketplace', 'update', MARKETPLACE)
  const wanted = await catalogPlugins($, cli)
  const installed = (await cli.json<Installed[]>('list')).filter(p => p.id.endsWith(`@${MARKETPLACE}`))
  const have = new Set(installed.map(p => nameOf(p.id)))
  const changes: Changes = { added: [], removed: [], updated: [] }

  for (const p of installed) {
    const name = nameOf(p.id)
    const keep = wanted.has(name)
    await cli.run(keep ? 'update' : 'uninstall', p.id, '--scope', p.scope)
    changes[keep ? 'updated' : 'removed'].push(name)
  }
  for (const name of wanted) {
    if (have.has(name)) continue
    await cli.run('install', `${name}@${MARKETPLACE}`, '--scope', 'user')
    changes.added.push(name)
  }
  return changes
}

const summary = ({ added, removed, updated }: Changes) => {
  const parts = [
    added.length && `+${added.join(' +')}`,
    removed.length && `-${removed.join(' -')}`,
    updated.length && `updated ${updated.join(', ')}`,
  ].filter(Boolean)
  return parts.join(' · ') || 'nothing installed'
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'ckupdate',
      description: 'Sync claude-kit plugins: install new, remove gone, update the rest',
      immediate: true,
    })
    return next(e)
  })

  on('command.run', { command: 'ckupdate' }, async $ => {
    try {
      $.ui.toast('Syncing claude-kit…')
      const changes = await sync($)
      $.ui.toast(`claude-kit: ${summary(changes)}, reloading…`)
      // A command can't run another command from inside its own hook.
      $.clock.after(0, () => void $.command.run({ command: 'reload-plugins', args: '' }))
    } catch (err) {
      $.ui.toast(`ckupdate failed: ${message(err)}`)
    }
    return {}
  })
}
