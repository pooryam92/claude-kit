import type { CommandRunInput, On, ProcessRunResult } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const DIR = '/home/me/proj'

const exited = (exitCode: number, stderr = ''): ProcessRunResult =>
  ({ exitCode, stdout: '', stderr, isStdoutTruncated: false, isStderrTruncated: false })

const ckopen: CommandRunInput = {
  command: 'ckopen',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 120 },
}

type Host = { cwd?: string; os?: string; code?: ProcessRunResult }

const host = (on: On, { cwd = DIR, os, code = exited(0) }: Host = {}) => {
  const toasts: string[] = []
  const ran: (readonly string[])[] = []
  on('session.cwd', () => ({ value: cwd }))
  on('env.get', () => ({ value: os }))
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('process.run', (_$, e) => {
    ran.push(e.argv)
    return { value: code }
  })
  return { toasts, ran }
}

test('/ckopen runs code on the session directory and toasts', async ($, on) => {
  const { toasts, ran } = host(on)

  const result = await $.command.run(ckopen)

  expect(ran).toEqual([['code', DIR]])
  expect(toasts).toEqual([`Opened ${DIR} in VS Code`])
  expect(result.text).toBeUndefined()
})

test('/ckopen goes through cmd on Windows', async ($, on) => {
  const { ran } = host(on, { cwd: 'C:\\Users\\me\\proj', os: 'Windows_NT' })

  await $.command.run(ckopen)

  expect(ran).toEqual([['cmd', '/c', 'code', 'C:\\Users\\me\\proj']])
})

test('/ckopen toasts a failing code', async ($, on) => {
  const { toasts } = host(on, { code: exited(127, 'code: not found\n') })

  await $.command.run(ckopen)

  expect(toasts).toEqual(['code exited 127: code: not found'])
})
