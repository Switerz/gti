export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'lead' | 'member'
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'lead' | 'member'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'lead' | 'member'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      allowed_emails: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'lead' | 'member'
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'admin' | 'lead' | 'member'
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'lead' | 'member'
          active?: boolean
          created_at?: string
        }
      }
      task_statuses: {
        Row: {
          id: string
          name: string
          slug: string
          position: number
          color: string | null
          is_final: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          position: number
          color?: string | null
          is_final?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          position?: number
          color?: string | null
          is_final?: boolean
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string | null
          active?: boolean
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          category_id: string | null
          active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category_id?: string | null
          active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category_id?: string | null
          active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status_id: string
          category_id: string | null
          project_id: string | null
          creator_id: string
          owner_id: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          due_date: string | null
          start_date: string | null
          completed_at: string | null
          position: number
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status_id: string
          category_id?: string | null
          project_id?: string | null
          creator_id: string
          owner_id?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          start_date?: string | null
          completed_at?: string | null
          position?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status_id?: string
          category_id?: string | null
          project_id?: string | null
          creator_id?: string
          owner_id?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          start_date?: string | null
          completed_at?: string | null
          position?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      task_assignees: {
        Row: {
          task_id: string
          profile_id: string
          assigned_by: string | null
          created_at: string
        }
        Insert: {
          task_id: string
          profile_id: string
          assigned_by?: string | null
          created_at?: string
        }
        Update: {
          task_id?: string
          profile_id?: string
          assigned_by?: string | null
          created_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          author_id: string | null
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          author_id?: string | null
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          author_id?: string | null
          body?: string
          created_at?: string
          updated_at?: string
        }
      }
      task_checklist_items: {
        Row: {
          id: string
          task_id: string
          title: string
          is_done: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          title: string
          is_done?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          title?: string
          is_done?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      task_activity_logs: {
        Row: {
          id: string
          task_id: string
          actor_id: string | null
          action: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          actor_id?: string | null
          action: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          actor_id?: string | null
          action?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      is_active_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_lead_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_edit_task: {
        Args: { task_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
