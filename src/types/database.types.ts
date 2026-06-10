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
          recurrence_type: 'none' | 'weekly' | 'monthly'
          estimated_hours: number | null
          actual_hours: number | null
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
          recurrence_type?: 'none' | 'weekly' | 'monthly'
          estimated_hours?: number | null
          actual_hours?: number | null
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
          recurrence_type?: 'none' | 'weekly' | 'monthly'
          estimated_hours?: number | null
          actual_hours?: number | null
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
      okr_objectives: {
        Row: {
          id: string
          macro_title: string
          description: string | null
          semester: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          macro_title: string
          description?: string | null
          semester?: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          macro_title?: string
          description?: string | null
          semester?: string
          position?: number
          created_at?: string
        }
      }
      okr_key_results: {
        Row: {
          id: string
          objective_id: string
          code: string
          title: string
          owner: string | null
          updater: string | null
          data_source: string | null
          grade_min: number
          grade_target: number
          current_value: number
          notes: string | null
          dynamic_milestones: boolean
          position: number
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          objective_id: string
          code: string
          title: string
          owner?: string | null
          updater?: string | null
          data_source?: string | null
          grade_min?: number
          grade_target?: number
          current_value?: number
          notes?: string | null
          dynamic_milestones?: boolean
          position?: number
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          objective_id?: string
          code?: string
          title?: string
          owner?: string | null
          updater?: string | null
          data_source?: string | null
          grade_min?: number
          grade_target?: number
          current_value?: number
          notes?: string | null
          dynamic_milestones?: boolean
          position?: number
          updated_at?: string
          created_at?: string
        }
      }
      okr_milestones: {
        Row: {
          id: string
          kr_id: string
          label: string
          target_value: number
          current_value: number
          position: number
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          kr_id: string
          label: string
          target_value?: number
          current_value?: number
          position?: number
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          kr_id?: string
          label?: string
          target_value?: number
          current_value?: number
          position?: number
          updated_at?: string
          created_at?: string
        }
      }
      kpi_groups: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          position: number
          active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          position?: number
          active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          position?: number
          active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      kpis: {
        Row: {
          id: string
          name: string
          slug: string | null
          description: string | null
          group_id: string | null
          category_id: string | null
          project_id: string | null
          owner_id: string | null
          created_by: string | null
          owner_label: string | null
          product: string | null
          format_kind: string
          decimal_places: number
          target_operator: string
          target_value: number | null
          target_label: string | null
          unit_label: string | null
          chart_type: string
          active: boolean
          position: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          description?: string | null
          group_id?: string | null
          category_id?: string | null
          project_id?: string | null
          owner_id?: string | null
          created_by?: string | null
          owner_label?: string | null
          product?: string | null
          format_kind?: string
          decimal_places?: number
          target_operator?: string
          target_value?: number | null
          target_label?: string | null
          unit_label?: string | null
          chart_type?: string
          active?: boolean
          position?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          description?: string | null
          group_id?: string | null
          category_id?: string | null
          project_id?: string | null
          owner_id?: string | null
          created_by?: string | null
          owner_label?: string | null
          product?: string | null
          format_kind?: string
          decimal_places?: number
          target_operator?: string
          target_value?: number | null
          target_label?: string | null
          unit_label?: string | null
          chart_type?: string
          active?: boolean
          position?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      kpi_assignments: {
        Row: {
          kpi_id: string
          profile_id: string
          assigned_by: string | null
          created_at: string | null
        }
        Insert: {
          kpi_id: string
          profile_id: string
          assigned_by?: string | null
          created_at?: string | null
        }
        Update: {
          kpi_id?: string
          profile_id?: string
          assigned_by?: string | null
          created_at?: string | null
        }
      }
      kpi_weekly_values: {
        Row: {
          id: string
          kpi_id: string | null
          iso_year: number
          iso_week: number
          week_start: string
          week_end: string
          value: number | null
          value_text: string | null
          target_value_snapshot: number | null
          target_operator_snapshot: string | null
          status: string
          notes: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          kpi_id?: string | null
          iso_year: number
          iso_week: number
          week_start: string
          week_end: string
          value?: number | null
          value_text?: string | null
          target_value_snapshot?: number | null
          target_operator_snapshot?: string | null
          status?: string
          notes?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          kpi_id?: string | null
          iso_year?: number
          iso_week?: number
          week_start?: string
          week_end?: string
          value?: number | null
          value_text?: string | null
          target_value_snapshot?: number | null
          target_operator_snapshot?: string | null
          status?: string
          notes?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      kpi_action_plans: {
        Row: {
          id: string
          kpi_id: string | null
          kpi_weekly_value_id: string | null
          restriction_text: string | null
          restriction_doc: Json | null
          action_text: string | null
          action_doc: Json | null
          due_date: string | null
          status: string
          owner_id: string | null
          created_by: string | null
          position: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          kpi_id?: string | null
          kpi_weekly_value_id?: string | null
          restriction_text?: string | null
          restriction_doc?: Json | null
          action_text?: string | null
          action_doc?: Json | null
          due_date?: string | null
          status?: string
          owner_id?: string | null
          created_by?: string | null
          position?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          kpi_id?: string | null
          kpi_weekly_value_id?: string | null
          restriction_text?: string | null
          restriction_doc?: Json | null
          action_text?: string | null
          action_doc?: Json | null
          due_date?: string | null
          status?: string
          owner_id?: string | null
          created_by?: string | null
          position?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      kpi_offenders: {
        Row: {
          id: string
          kpi_id: string | null
          kpi_weekly_value_id: string | null
          label: string
          impact_value: number
          impact_label: string | null
          description: string | null
          position: number
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          kpi_id?: string | null
          kpi_weekly_value_id?: string | null
          label: string
          impact_value: number
          impact_label?: string | null
          description?: string | null
          position?: number
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          kpi_id?: string | null
          kpi_weekly_value_id?: string | null
          label?: string
          impact_value?: number
          impact_label?: string | null
          description?: string | null
          position?: number
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      kpi_comments: {
        Row: {
          id: string
          kpi_id: string | null
          kpi_weekly_value_id: string | null
          author_id: string | null
          body: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          kpi_id?: string | null
          kpi_weekly_value_id?: string | null
          author_id?: string | null
          body: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          kpi_id?: string | null
          kpi_weekly_value_id?: string | null
          author_id?: string | null
          body?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      kpi_activity_logs: {
        Row: {
          id: string
          kpi_id: string | null
          actor_id: string | null
          action: string
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          kpi_id?: string | null
          actor_id?: string | null
          action: string
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          kpi_id?: string | null
          actor_id?: string | null
          action?: string
          metadata?: Json | null
          created_at?: string | null
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
      can_edit_kpi: {
        Args: { kpi_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
