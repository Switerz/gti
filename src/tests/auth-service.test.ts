import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  authService,
  getSupabaseAuthStorageKey,
  hasAuthCallbackParams,
} from '@/features/auth/auth.service'

const supabaseUrl = 'https://abc123.supabase.co'
const storageKey = 'sb-abc123-auth-token'

function makeSession(expiresAt: number) {
  return {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_at: expiresAt,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'user-1',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'user@gogroup.com',
      app_metadata: {},
      user_metadata: {},
      created_at: '2026-05-15T00:00:00.000Z',
    },
  }
}

function createStorageMock() {
  const store = new Map<string, string>()

  return {
    clear: vi.fn(() => store.clear()),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
  }
}

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createStorageMock(),
  })
})

afterEach(() => {
  window.localStorage?.clear()
  window.history.replaceState(null, '', '/')
  vi.unstubAllEnvs()
})

describe('getSupabaseAuthStorageKey', () => {
  it('derives the localStorage key from the Supabase project URL', () => {
    expect(getSupabaseAuthStorageKey(supabaseUrl)).toBe(storageKey)
  })

  it('returns null for invalid URLs', () => {
    expect(getSupabaseAuthStorageKey('not-a-url')).toBeNull()
  })
})

describe('hasAuthCallbackParams', () => {
  it('detects PKCE code callbacks', () => {
    window.history.replaceState(null, '', '/dashboard?code=oauth-code')

    expect(hasAuthCallbackParams()).toBe(true)
  })

  it('detects implicit token callbacks', () => {
    window.history.replaceState(null, '', '/dashboard#access_token=token')

    expect(hasAuthCallbackParams()).toBe(true)
  })

  it('returns false for regular app routes', () => {
    window.history.replaceState(null, '', '/dashboard')

    expect(hasAuthCallbackParams()).toBe(false)
  })
})

describe('authService.getCachedSession', () => {
  it('returns the cached Supabase currentSession without a network call', () => {
    vi.stubEnv('VITE_SUPABASE_URL', supabaseUrl)
    const nowMs = Date.UTC(2026, 4, 15, 12)
    const session = makeSession(nowMs / 1000 + 3600)

    window.localStorage.setItem(storageKey, JSON.stringify({ currentSession: session }))

    expect(authService.getCachedSession(nowMs)).toMatchObject({
      access_token: 'access-token',
      user: { id: 'user-1' },
    })
  })

  it('clears expired cached sessions and returns null', () => {
    vi.stubEnv('VITE_SUPABASE_URL', supabaseUrl)
    const nowMs = Date.UTC(2026, 4, 15, 12)
    const session = makeSession(nowMs / 1000 - 1)

    window.localStorage.setItem(storageKey, JSON.stringify({ currentSession: session }))

    expect(authService.getCachedSession(nowMs)).toBeNull()
    expect(window.localStorage.getItem(storageKey)).toBeNull()
  })

  it('clears malformed session JSON and returns null', () => {
    vi.stubEnv('VITE_SUPABASE_URL', supabaseUrl)
    window.localStorage.setItem(storageKey, '{')

    expect(authService.getCachedSession()).toBeNull()
    expect(window.localStorage.getItem(storageKey)).toBeNull()
  })

  it('returns null when localStorage is unavailable', () => {
    vi.stubEnv('VITE_SUPABASE_URL', supabaseUrl)
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: undefined,
    })

    expect(authService.getCachedSession()).toBeNull()
  })
})
