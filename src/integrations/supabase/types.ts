export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      coffee_grades: {
        Row: {
          created_at: string
          grade_name: string
          id: string
          lower_price: number
          updated_at: string
          upper_price: number
        }
        Insert: {
          created_at?: string
          grade_name: string
          id?: string
          lower_price: number
          updated_at?: string
          upper_price: number
        }
        Update: {
          created_at?: string
          grade_name?: string
          id?: string
          lower_price?: number
          updated_at?: string
          upper_price?: number
        }
        Relationships: []
      }
      daily_closing_prices: {
        Row: {
          closing_price: number
          created_at: string
          entered_by: string
          grade_name: string
          id: string
          price_date: string
          updated_at: string
        }
        Insert: {
          closing_price: number
          created_at?: string
          entered_by: string
          grade_name: string
          id?: string
          price_date: string
          updated_at?: string
        }
        Update: {
          closing_price?: number
          created_at?: string
          entered_by?: string
          grade_name?: string
          id?: string
          price_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_plans: {
        Row: {
          created_at: string
          duration: string
          id: string
          months: number
          price: number
        }
        Insert: {
          created_at?: string
          duration: string
          id?: string
          months: number
          price: number
        }
        Update: {
          created_at?: string
          duration?: string
          id?: string
          months?: number
          price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          is_paid: boolean
          mobile_number: string
          name: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          role: Database["public"]["Enums"]["user_role"]
          selected_plan: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          is_paid?: boolean
          mobile_number: string
          name: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          role?: Database["public"]["Enums"]["user_role"]
          selected_plan?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          is_paid?: boolean
          mobile_number?: string
          name?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          role?: Database["public"]["Enums"]["user_role"]
          selected_plan?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      samples: {
        Row: {
          created_at: string
          grade: string
          grn: string
          id: string
          image_url: string
          owner_name: string
          total_value: number
          upload_date: string
          uploaded_by: string
          warehouse: string | null
        }
        Insert: {
          created_at?: string
          grade: string
          grn: string
          id?: string
          image_url: string
          owner_name: string
          total_value: number
          upload_date?: string
          uploaded_by: string
          warehouse?: string | null
        }
        Update: {
          created_at?: string
          grade?: string
          grn?: string
          id?: string
          image_url?: string
          owner_name?: string
          total_value?: number
          upload_date?: string
          uploaded_by?: string
          warehouse?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_price_range: {
        Args: { grade_name_param: string }
        Returns: {
          grade_name: string
          lower_price: number
          upper_price: number
          last_closing_price: number
          last_price_date: string
          days_without_sales: number
        }[]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      payment_status: "unpaid" | "pending" | "paid"
      user_role: "normal" | "admin" | "super_admin"
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
    Enums: {
      payment_status: ["unpaid", "pending", "paid"],
      user_role: ["normal", "admin", "super_admin"],
    },
  },
} as const
