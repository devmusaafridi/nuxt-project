export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          status: string
          worker_id: string | null
          worker_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          status: string
          worker_id?: string | null
          worker_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          status?: string
          worker_id?: string | null
          worker_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      diesel_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          given_to: string
          id: string
          liters: number
          machine_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          given_to: string
          id?: string
          liters: number
          machine_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          given_to?: string
          id?: string
          liters?: number
          machine_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diesel_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          role: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          username?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_user: string | null
          capital_allocated: number
          created_at: string
          id: string
          name: string
        }
        Insert: {
          assigned_user?: string | null
          capital_allocated?: number
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          assigned_user?: string | null
          capital_allocated?: number
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_user_fkey"
            columns: ["assigned_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      truck_attendance: {
        Row: {
          date: string
          id: string
          present: boolean
          truck_id: string
        }
        Insert: {
          date: string
          id?: string
          present?: boolean
          truck_id: string
        }
        Update: {
          date?: string
          id?: string
          present?: boolean
          truck_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "truck_attendance_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      truck_drivers: {
        Row: {
          cnic_picture_url: string | null
          created_at: string
          driver_name: string
          id: string
          is_active: boolean
          mobile_number: string | null
          picture_url: string | null
          truck_id: string
        }
        Insert: {
          cnic_picture_url?: string | null
          created_at?: string
          driver_name: string
          id?: string
          is_active?: boolean
          mobile_number?: string | null
          picture_url?: string | null
          truck_id: string
        }
        Update: {
          cnic_picture_url?: string | null
          created_at?: string
          driver_name?: string
          id?: string
          is_active?: boolean
          mobile_number?: string | null
          picture_url?: string | null
          truck_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "truck_drivers_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      trucks: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          owner_mobile_number: string | null
          owner_name: string
          picture_url: string | null
          project_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          owner_mobile_number?: string | null
          owner_name: string
          picture_url?: string | null
          project_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          owner_mobile_number?: string | null
          owner_name?: string
          picture_url?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trucks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trucks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          project_id: string | null
          status: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          project_id?: string | null
          status: string
          worker_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          project_id?: string | null
          status?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wa_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_wa_worker"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          created_at: string | null
          daily_salary: number
          id: string
          mobile_number: string | null
          name: string
          project_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          daily_salary?: number
          id?: string
          mobile_number?: string | null
          name: string
          project_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          daily_salary?: number
          id?: string
          mobile_number?: string | null
          name?: string
          project_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "workers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
