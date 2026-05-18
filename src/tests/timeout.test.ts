import { describe, expect, it, vi } from 'vitest'

import { TimeoutError, withTimeout } from '@/lib/timeout'

describe('withTimeout', () => {
  it('resolves when the promise completes before the timeout', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 100)).resolves.toBe('ok')
  })

  it('rejects with TimeoutError when the promise does not settle in time', async () => {
    vi.useFakeTimers()

    const result = withTimeout(new Promise<string>(() => undefined), 100, 'profile query timed out')
    vi.advanceTimersByTime(100)

    await expect(result).rejects.toBeInstanceOf(TimeoutError)
    await expect(result).rejects.toThrow('profile query timed out')

    vi.useRealTimers()
  })

  it('keeps the original rejection when it happens before the timeout', async () => {
    const error = new Error('network failed')

    await expect(withTimeout(Promise.reject(error), 100)).rejects.toBe(error)
  })
})
