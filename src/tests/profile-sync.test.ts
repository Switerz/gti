import { describe, expect, it } from 'vitest'

import { buildProfileInsert, buildProfileSelfUpdate } from '@/features/auth/profile-sync'

describe('profile sync payloads', () => {
  it('includes allowlist role only when inserting the profile', () => {
    expect(
      buildProfileInsert({
        id: 'user-1',
        email: 'USER@GOGROUP.COM',
        full_name: 'User',
        avatar_url: null,
        role: 'admin',
      }),
    ).toMatchObject({
      id: 'user-1',
      email: 'user@gogroup.com',
      role: 'admin',
    })
  })

  it('never includes role or active in self-update payload', () => {
    const payload = buildProfileSelfUpdate({
      email: 'USER@GOGROUP.COM',
      full_name: 'User',
      avatar_url: 'https://example.com/avatar.png',
    })

    expect(payload).toEqual({
      email: 'user@gogroup.com',
      full_name: 'User',
      avatar_url: 'https://example.com/avatar.png',
    })
    expect(payload).not.toHaveProperty('role')
    expect(payload).not.toHaveProperty('active')
  })
})
