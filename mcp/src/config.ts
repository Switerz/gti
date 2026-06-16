import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface GtiMcpConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  userAccessToken?: string
}

const loadLocalEnv = () => {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) continue

    const name = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[name] ??= value
  }
}

const readEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

export const getConfig = (): GtiMcpConfig => {
  loadLocalEnv()

  return {
    supabaseUrl: readEnv('SUPABASE_URL') ?? readEnv('VITE_SUPABASE_URL') ?? '',
    supabaseAnonKey: readEnv('SUPABASE_ANON_KEY') ?? readEnv('VITE_SUPABASE_ANON_KEY') ?? '',
    userAccessToken: readEnv('GTI_MCP_USER_ACCESS_TOKEN'),
  }
}

export const getConfigStatus = (config: GtiMcpConfig) => ({
  hasSupabaseUrl: Boolean(config.supabaseUrl),
  hasSupabaseAnonKey: Boolean(config.supabaseAnonKey),
  hasUserAccessToken: Boolean(config.userAccessToken),
  isReadyForReads: Boolean(config.supabaseUrl && config.supabaseAnonKey && config.userAccessToken),
  isReadyForUserScopedWrites: Boolean(
    config.supabaseUrl && config.supabaseAnonKey && config.userAccessToken,
  ),
})
