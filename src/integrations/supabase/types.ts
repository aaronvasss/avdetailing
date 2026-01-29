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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      booking_add_ons: {
        Row: {
          add_on_id: string | null
          booking_id: string
          created_at: string
          id: string
          name: string
          price: number
        }
        Insert: {
          add_on_id?: string | null
          booking_id: string
          created_at?: string
          id?: string
          name: string
          price: number
        }
        Update: {
          add_on_id?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_add_ons_add_on_id_fkey"
            columns: ["add_on_id"]
            isOneToOne: false
            referencedRelation: "service_add_ons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_add_ons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_internal_notes: {
        Row: {
          booking_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_internal_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_photos: {
        Row: {
          booking_id: string
          caption: string | null
          created_at: string
          id: string
          photo_type: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          booking_id: string
          caption?: string | null
          created_at?: string
          id?: string
          photo_type: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          booking_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          photo_type?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_photos_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          add_ons_total: number | null
          address_id: string | null
          address_notes: string | null
          created_at: string
          customer_notes: string | null
          deposit_amount: number | null
          duration_minutes: number | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          internal_notes: string | null
          manage_token: string | null
          membership_id: string | null
          payment_method: string | null
          payment_status: string | null
          scheduled_date: string
          scheduled_time: string
          service_address: string | null
          service_city: string | null
          service_id: string
          service_state: string | null
          service_zip: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal: number | null
          total_price: number | null
          updated_at: string
          user_id: string | null
          vehicle_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_size: string | null
          vehicle_type: string | null
          vehicle_year: number | null
        }
        Insert: {
          add_ons_total?: number | null
          address_id?: string | null
          address_notes?: string | null
          created_at?: string
          customer_notes?: string | null
          deposit_amount?: number | null
          duration_minutes?: number | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          internal_notes?: string | null
          manage_token?: string | null
          membership_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          scheduled_date: string
          scheduled_time: string
          service_address?: string | null
          service_city?: string | null
          service_id: string
          service_state?: string | null
          service_zip?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          total_price?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_size?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Update: {
          add_ons_total?: number | null
          address_id?: string | null
          address_notes?: string | null
          created_at?: string
          customer_notes?: string | null
          deposit_amount?: number | null
          duration_minutes?: number | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          internal_notes?: string | null
          manage_token?: string | null
          membership_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          scheduled_date?: string
          scheduled_time?: string
          service_address?: string | null
          service_city?: string | null
          service_id?: string
          service_state?: string | null
          service_zip?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          total_price?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_size?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "customer_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "customer_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          source: string | null
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string | null
          notes: string | null
          state: string
          street_address: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          notes?: string | null
          state?: string
          street_address: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          notes?: string | null
          state?: string
          street_address?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      customer_memberships: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          membership_plan_id: string
          next_service_date: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          membership_plan_id: string
          next_service_date?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          membership_plan_id?: string
          next_service_date?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_memberships_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "customer_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_vehicles: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_default: boolean | null
          license_plate: string | null
          make: string | null
          model: string | null
          notes: string | null
          size_category: string | null
          updated_at: string
          user_id: string
          vehicle_type: string
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          size_category?: string | null
          updated_at?: string
          user_id: string
          vehicle_type: string
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          size_category?: string | null
          updated_at?: string
          user_id?: string
          vehicle_type?: string
          year?: number | null
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          created_at: string
          description: string | null
          features: string[] | null
          frequency: string
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          price: number
          slug: string
          sort_order: number | null
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          frequency: string
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          price: number
          slug: string
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          price?: number
          slug?: string
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount_cents: number
          booking_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          membership_id: string | null
          metadata: Json | null
          payment_type: string
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          membership_id?: string | null
          metadata?: Json | null
          payment_type: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          membership_id?: string | null
          metadata?: Json | null
          payment_type?: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "customer_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          calendar_token: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_token?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_token?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_add_ons: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          service_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          service_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_add_ons_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          created_at: string | null
          description: string | null
          duration_estimate: string | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          price: number
          service_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_estimate?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          price: number
          service_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_estimate?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          price?: number
          service_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number
          category: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
          vehicle_types: string[] | null
        }
        Insert: {
          base_price: number
          category: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
          vehicle_types?: string[] | null
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
          vehicle_types?: string[] | null
        }
        Relationships: []
      }
      sms_messages: {
        Row: {
          body: string
          booking_id: string | null
          created_at: string
          direction: string
          from_number: string
          id: string
          message_sid: string | null
          status: string | null
          to_number: string
        }
        Insert: {
          body: string
          booking_id?: string | null
          created_at?: string
          direction: string
          from_number: string
          id?: string
          message_sid?: string | null
          status?: string | null
          to_number: string
        }
        Update: {
          body?: string
          booking_id?: string | null
          created_at?: string
          direction?: string
          from_number?: string
          id?: string
          message_sid?: string | null
          status?: string | null
          to_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_prices: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          package_name: string
          price_cents: number
          service_type: string
          stripe_price_id: string
          stripe_product_id: string
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          package_name: string
          price_cents: number
          service_type: string
          stripe_price_id: string
          stripe_product_id: string
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          package_name?: string
          price_cents?: number
          service_type?: string
          stripe_price_id?: string
          stripe_product_id?: string
          updated_at?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          created_at: string
          current_bookings: number | null
          id: string
          is_available: boolean | null
          max_bookings: number | null
          slot_date: string
          slot_time: string
        }
        Insert: {
          created_at?: string
          current_bookings?: number | null
          id?: string
          is_available?: boolean | null
          max_bookings?: number | null
          slot_date: string
          slot_time: string
        }
        Update: {
          created_at?: string
          current_bookings?: number | null
          id?: string
          is_available?: boolean | null
          max_bookings?: number | null
          slot_date?: string
          slot_time?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_booking_token: { Args: never; Returns: string }
      generate_calendar_token: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "customer" | "staff"
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
      app_role: ["admin", "customer", "staff"],
    },
  },
} as const
