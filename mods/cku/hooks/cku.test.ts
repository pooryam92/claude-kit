import type { CommandRunInput, ProcessRunResult } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const ok = (stdout = ''): ProcessRunResult =>
  ({ exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false })
const run: CommandRunInput = {
  command: 'cku',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 120 },
}
const DIR = '/home/me/.claude/plugins/marketplaces/claude-kit'
const MARKETS = JSON.stringify([
  { name: 'claude-plugins-official', installLocation: '/x' },
  { name: 'claude-kit', installLocation: DIR },
])
const CATALOG = JSON.stringify({ name: 'claude-kit', plugins: [{ name: 'cko' }, { name: 'cku' }] })
const INSTALLED = JSON.stringify([
  { id: 'open@claude-kit', scope: 'user' },
  { id: 'cku@claude-kit', scope: 'user' },
  { id: 'github@claude-plugins-official', scope: 'user' },
])

const answer = (argv: readonly string[]) => {
  const cmd = argv.join(' ')
  if (cmd === 'claude plugin marketplace list --json') return ok(MARKETS)
  if (cmd === `cat ${DIR}/.claude-plugin/marketplace.json`) return ok(CATALOG)
  if (cmd === 'claude plugin list --json') return ok(INSTALLED)
  return ok()
}

test('/cku installs new mods, removes gone ones, updates the rest, then reloads', async ($, on) => {
  const clock = mock.clock(on)
  const ran: string[] = []
  const toasts: string[] = []
  let reloaded = false
  on('process.run', (_$, e) => {
    ran.push(e.argv.join(' '))
    return { value: answer(e.argv) }
  })
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('command.run', { command: 'reload-plugins' }, () => {
    reloaded = true
    return {}
  })

  await $.command.run(run)
  expect(reloaded).toBe(false)
  await clock.advance(0)

  expect(ran).toEqual([
    'claude plugin marketplace update claude-kit',
    'claude plugin marketplace list --json',
    `cat ${DIR}/.claude-plugin/marketplace.json`,
    'claude plugin list --json',
    'claude plugin uninstall open@claude-kit --scope user',
    'claude plugin update cku@claude-kit --scope user',
    'claude plugin install cko@claude-kit --scope user',
  ])
  expect(reloaded).toBe(true)
  expect(toasts.at(-1)).toBe('claude-kit: +cko · -open · updated cku, reloading…')
})

test('/cku toasts a failure and stops', async ($, on) => {
  const toasts: string[] = []
  on('process.run', () => ({ value: { ...ok(), exitCode: 1, stderr: 'network down' } }))
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })

  await $.command.run(run)

  expect(toasts.at(-1)).toBe('cku failed: claude plugin marketplace update claude-kit: network down')
})
