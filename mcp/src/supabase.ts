import { createClient } from '@supabase/supabase-js'

import type { GtiMcpConfig } from './config.js'

export const createGtiSupabaseClient = (config: GtiMcpConfig) =>
  createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: config.userAccessToken
      ? {
          headers: {
            Authorization: `Bearer ${config.userAccessToken}`,
          },
        }
      : undefined,
  })

export const requireGtiSupabaseClient = (config: GtiMcpConfig) => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required for Supabase-backed tools.')
  }

  if (!config.userAccessToken) {
    throw new Error('GTI_MCP_USER_ACCESS_TOKEN is required for GTI reads because RLS uses auth.uid().')
  }

  return createGtiSupabaseClient(config)
}
