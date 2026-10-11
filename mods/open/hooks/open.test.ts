import type { CommandRunInput, ProcessRunResult } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const ok: ProcessRunResult = { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false }
const typed = (args: string): CommandRunInput => ({
  command: 'open',
  args,
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 120 },
})

test('/open runs code on the session directory', async ($, on) => {
  const ran: (readonly string[])[] = []
  on('session.cwd', () => ({ value: '/home/me/proj' }))
  on('process.run', (_$, e) => {
    ran.push(e.argv)
    return { value: ok }
  })

  const { text } = await $.command.run(typed(''))

  expect(ran).toEqual([['code', '/home/me/proj']])
  expect(text).toBe('Opened /home/me/proj in VS Code')
})


test('/open reports a failing code', async ($, on) => {
  on('session.cwd', () => ({ value: '/home/me/proj' }))
  on('process.run', () => ({ value: { ...ok, exitCode: 127, stderr: 'code: not found\n' } }))

  const { text } = await $.command.run(typed(''))

  expect(text).toBe('code exited 127: code: not found')
})
