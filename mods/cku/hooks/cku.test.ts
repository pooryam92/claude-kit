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
const LIST = JSON.stringify([
  { id: 'cko@claude-kit', scope: 'user' },
  { id: 'cku@claude-kit', scope: 'user' },
  { id: 'github@claude-plugins-official', scope: 'user' },
])

test('/cku updates the marketplace and each claude-kit mod, then reloads', async ($, on) => {
  const clock = mock.clock(on)
  const ran: string[] = []
  const toasts: string[] = []
  let reloaded = false
  on('process.run', (_$, e) => {
    ran.push(e.argv.join(' '))
    return { value: ok(e.argv.includes('list') ? LIST : '') }
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
    'claude plugin list --json',
    'claude plugin update cko@claude-kit --scope user',
    'claude plugin update cku@claude-kit --scope user',
  ])
  expect(reloaded).toBe(true)
  expect(toasts.at(-1)).toBe('Updated cko, cku, reloading…')
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
