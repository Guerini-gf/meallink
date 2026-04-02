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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      allergens: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      canteens: {
        Row: {
          address: string | null
          canteen_code: string | null
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          seats_per_table: number | null
          total_tables: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          canteen_code?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          seats_per_table?: number | null
          total_tables?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          canteen_code?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          seats_per_table?: number | null
          total_tables?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_menus: {
        Row: {
          canteen_id: string
          created_at: string | null
          created_by: string | null
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          menu_date: string
          order_deadline: string | null
          updated_at: string | null
        }
        Insert: {
          canteen_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          menu_date: string
          order_deadline?: string | null
          updated_at?: string | null
        }
        Update: {
          canteen_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          menu_date?: string
          order_deadline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_menus_canteen_id_fkey"
            columns: ["canteen_id"]
            isOneToOne: false
            referencedRelation: "canteens"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_allergens: {
        Row: {
          allergen_id: string | null
          created_at: string | null
          dish_id: string | null
          id: string
        }
        Insert: {
          allergen_id?: string | null
          created_at?: string | null
          dish_id?: string | null
          id?: string
        }
        Update: {
          allergen_id?: string | null
          created_at?: string | null
          dish_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_allergens_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_allergens_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          available_for_takeaway: boolean | null
          canteen_id: string | null
          category: string
          created_at: string | null
          id: string
          name: string
          takeaway_available_from: string | null
          takeaway_available_until: string | null
          variant: string | null
        }
        Insert: {
          available_for_takeaway?: boolean | null
          canteen_id?: string | null
          category: string
          created_at?: string | null
          id?: string
          name: string
          takeaway_available_from?: string | null
          takeaway_available_until?: string | null
          variant?: string | null
        }
        Update: {
          available_for_takeaway?: boolean | null
          canteen_id?: string | null
          category?: string
          created_at?: string | null
          id?: string
          name?: string
          takeaway_available_from?: string | null
          takeaway_available_until?: string | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dishes_canteen_id_fkey"
            columns: ["canteen_id"]
            isOneToOne: false
            referencedRelation: "canteens"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_orders: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          is_takeaway: boolean | null
          menu_id: string
          notes: string | null
          selected_dishes: string[]
          served: boolean | null
          served_at: string | null
          takeaway_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          is_takeaway?: boolean | null
          menu_id: string
          notes?: string | null
          selected_dishes: string[]
          served?: boolean | null
          served_at?: string | null
          takeaway_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          is_takeaway?: boolean | null
          menu_id?: string
          notes?: string | null
          selected_dishes?: string[]
          served?: boolean | null
          served_at?: string | null
          takeaway_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_orders_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "daily_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_dishes: {
        Row: {
          created_at: string | null
          dish_id: string | null
          id: string
          menu_id: string | null
        }
        Insert: {
          created_at?: string | null
          dish_id?: string | null
          id?: string
          menu_id?: string | null
        }
        Update: {
          created_at?: string | null
          dish_id?: string | null
          id?: string
          menu_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_dishes_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_dishes_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "daily_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_employees: {
        Row: {
          badge_code: string
          canteen_id: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          email: string | null
          employee_number: string | null
          full_name: string
          id: string
        }
        Insert: {
          badge_code: string
          canteen_id: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          employee_number?: string | null
          full_name: string
          id?: string
        }
        Update: {
          badge_code?: string
          canteen_id?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          employee_number?: string | null
          full_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_employees_canteen_id_fkey"
            columns: ["canteen_id"]
            isOneToOne: false
            referencedRelation: "canteens"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          badge_code: string
          canteen_id: string | null
          created_at: string | null
          employee_number: string | null
          full_name: string
          id: string
          push_token: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          badge_code: string
          canteen_id?: string | null
          created_at?: string | null
          employee_number?: string | null
          full_name: string
          id: string
          push_token?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          badge_code?: string
          canteen_id?: string | null
          created_at?: string | null
          employee_number?: string | null
          full_name?: string
          id?: string
          push_token?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_canteen_id_fkey"
            columns: ["canteen_id"]
            isOneToOne: false
            referencedRelation: "canteens"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      table_reservations: {
        Row: {
          canteen_id: string
          created_at: string | null
          guests: number | null
          id: string
          reservation_date: string
          status: string | null
          table_number: number
          time_slot: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          canteen_id: string
          created_at?: string | null
          guests?: number | null
          id?: string
          reservation_date: string
          status?: string | null
          table_number: number
          time_slot: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          canteen_id?: string
          created_at?: string | null
          guests?: number | null
          id?: string
          reservation_date?: string
          status?: string | null
          table_number?: number
          time_slot?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_reservations_canteen_id_fkey"
            columns: ["canteen_id"]
            isOneToOne: false
            referencedRelation: "canteens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_allergens: {
        Row: {
          allergen_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          allergen_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          allergen_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_allergens_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_allergens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_pending_employees: { Args: never; Returns: undefined }
      get_badge_canteen: { Args: { _badge_code: string }; Returns: string }
      get_operational_profile: {
        Args: { _badge_code: string }
        Returns: {
          badge_code: string
          canteen_id: string
          full_name: string
          id: string
        }[]
      }
      get_push_subscription_ids_for_canteen: {
        Args: { _canteen_id: string }
        Returns: {
          user_id: string
        }[]
      }
      get_user_canteen: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_push_subscription: {
        Args: { _user_id: string }
        Returns: boolean
      }
      validate_badge_code: { Args: { _badge_code: string }; Returns: boolean }
    }
    Enums: {
      meal_type: "lunch" | "dinner"
      user_role: "chef" | "operator" | "customer"
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
      meal_type: ["lunch", "dinner"],
      user_role: ["chef", "operator", "customer"],
    },
  },
} as const
