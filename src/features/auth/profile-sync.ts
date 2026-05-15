import type { Database } from '@/types/database.types'
import type { Profile } from '@/types/domain'

type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

type ProfileSyncInput = {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  role: string
}

type ProfileSelfUpdateInput = Omit<ProfileSyncInput, 'id' | 'role'>

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

export function buildProfileInsert(params: ProfileSyncInput): ProfileInsert {
  return {
    id: params.id,
    email: normalizeEmail(params.email),
    full_name: params.full_name ?? null,
    avatar_url: params.avatar_url ?? null,
    role: params.role as Profile['role'],
  }
}

export function buildProfileSelfUpdate(params: ProfileSelfUpdateInput): ProfileUpdate {
  return {
    email: normalizeEmail(params.email),
    full_name: params.full_name ?? null,
    avatar_url: params.avatar_url ?? null,
  }
}
