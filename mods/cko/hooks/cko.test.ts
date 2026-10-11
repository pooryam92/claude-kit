import type { CommandRunInput, ProcessRunResult } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const ok: ProcessRunResult = { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false }
const run: CommandRunInput = {
  command: 'cko',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 120 },
}

test('/cko runs code on the session directory and toasts', async ($, on) => {
  const ran: (readonly string[])[] = []
  const toasts: string[] = []
  on('session.cwd', () => ({ value: '/home/me/proj' }))
  on('process.run', (_$, e) => {
    ran.push(e.argv)
    return { value: ok }
  })
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })

  const result = await $.command.run(run)

  expect(ran).toEqual([['code', '/home/me/proj']])
  expect(toasts).toEqual(['Opened /home/me/proj in VS Code'])
  expect(result.text).toBeUndefined()
})

test('/cko toasts a failing code', async ($, on) => {
  const toasts: string[] = []
  on('session.cwd', () => ({ value: '/home/me/proj' }))
  on('process.run', () => ({ value: { ...ok, exitCode: 127, stderr: 'code: not found\n' } }))
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })

  await $.command.run(run)

  expect(toasts).toEqual(['code exited 127: code: not found'])
})
