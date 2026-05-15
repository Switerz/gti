import fs from 'node:fs'

import { createClient } from '@supabase/supabase-js'

function readLocalEnv(name) {
  const localEnv = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : ''
  const match = localEnv.match(new RegExp(`^${name}=(.*)$`, 'm'))
  return process.env[name] ?? match?.[1]?.trim()
}

const storageStatePath = process.env.E2E_AUTH_STORAGE_STATE ?? 'playwright/.auth/allowed-user.json'
const storage = JSON.parse(fs.readFileSync(storageStatePath, 'utf8'))
const authItem = storage.origins
  .flatMap((origin) => origin.localStorage)
  .find((item) => item.name.includes('auth-token'))

if (!authItem) throw new Error('Supabase auth token not found in storageState')

const token = JSON.parse(authItem.value)
const session = token.currentSession ?? token
const supabase = createClient(readLocalEnv('VITE_SUPABASE_URL'), readLocalEnv('VITE_SUPABASE_ANON_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data, error } = await supabase.auth.refreshSession({
  refresh_token: session.refresh_token,
})

if (error) throw error
if (!data.session) throw new Error('Supabase did not return a refreshed session')

authItem.value = JSON.stringify({
  ...token,
  currentSession: data.session,
  expiresAt: data.session.expires_at,
})

fs.writeFileSync(storageStatePath, `${JSON.stringify(storage, null, 2)}\n`)
console.log(`Refreshed ${storageStatePath}`)
