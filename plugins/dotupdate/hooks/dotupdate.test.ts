import type { CommandRunInput, On, ProcessRunResult } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const DIR = '/home/me/.claude/plugins/marketplaces/dotclaude'
const CATALOG_FILE = `${DIR}/.claude-plugin/marketplace.json`

const dotupdate: CommandRunInput = {
  command: 'dotupdate',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 120 },
}

const exited = (exitCode: number, output = ''): ProcessRunResult => ({
  exitCode,
  stdout: exitCode === 0 ? output : '',
  stderr: exitCode === 0 ? '' : output,
  isStdoutTruncated: false,
  isStderrTruncated: false,
})

const catalog = { name: 'dotclaude', plugins: [{ name: 'dotopen' }, { name: 'dotupdate' }] }
const outputs: Record<string, unknown> = {
  'claude plugin marketplace list --json': [
    { name: 'claude-plugins-official', installLocation: '/x' },
    { name: 'dotclaude', installLocation: DIR },
  ],
  'claude plugin list --json': [
    { id: 'open@dotclaude', scope: 'user' },
    { id: 'dotupdate@dotclaude', scope: 'user' },
    { id: 'github@claude-plugins-official', scope: 'user' },
  ],
}

type Host = { os?: string; failure?: string }

const host = (on: On, { os, failure }: Host = {}) => {
  const toasts: string[] = []
  const ran: string[] = []
  const read: string[] = []
  let reloaded = false
  on('env.get', () => ({ value: os }))
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('process.run', (_$, e) => {
    const cmd = e.argv.join(' ')
    ran.push(cmd)
    if (failure) return { value: exited(1, failure) }
    const key = cmd.replace(/^cmd \/c /, '')
    return { value: exited(0, key in outputs ? JSON.stringify(outputs[key]) : '') }
  })
  on('fs.read', (_$, e) => {
    read.push(e.path)
    return { value: JSON.stringify(catalog) }
  })
  on('command.run', { command: 'reload-plugins' }, () => {
    reloaded = true
    return {}
  })
  return { toasts, ran, read, reloaded: () => reloaded }
}

test('/dotupdate installs new plugins, removes gone ones, updates the rest, then reloads', async ($, on) => {
  const clock = mock.clock(on)
  const { toasts, ran, read, reloaded } = host(on)

  await $.command.run(dotupdate)
  expect(reloaded()).toBe(false)
  await clock.advance(0)

  expect(ran).toEqual([
    'claude plugin marketplace update dotclaude',
    'claude plugin marketplace list --json',
    'claude plugin list --json',
    'claude plugin uninstall open@dotclaude --scope user',
    'claude plugin update dotupdate@dotclaude --scope user',
    'claude plugin install dotopen@dotclaude --scope user',
  ])
  expect(read).toEqual([CATALOG_FILE])
  expect(reloaded()).toBe(true)
  expect(toasts.at(-1)).toBe('dotclaude: +dotopen · -open · updated dotupdate, reloading…')
})

test('/dotupdate goes through cmd on Windows', async ($, on) => {
  mock.clock(on)
  const { ran } = host(on, { os: 'Windows_NT' })

  await $.command.run(dotupdate)

  expect(ran[0]).toBe('cmd /c claude plugin marketplace update dotclaude')
  expect(ran.every(cmd => cmd.startsWith('cmd /c claude plugin '))).toBe(true)
})

test('/dotupdate toasts a failure and stops', async ($, on) => {
  const { toasts } = host(on, { failure: 'network down' })

  await $.command.run(dotupdate)

  expect(toasts.at(-1)).toBe('dotupdate failed: claude plugin marketplace update dotclaude: network down')
})
