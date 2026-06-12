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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      catalog_itineraries: {
        Row: {
          audit_report: string | null
          audited_at: string | null
          created_at: string
          description_en: string
          description_no: string | null
          description_pt: string | null
          destination: string | null
          duration: string | null
          estimated_trip_budget: string | null
          experience_type: string[] | null
          gallery_images: Json
          group_size_label: string | null
          hero_image_url: string | null
          hotels: Json
          id: string
          is_published: boolean
          itinerary_content_en: string | null
          itinerary_content_no: string | null
          itinerary_content_pt: string | null
          pdf_path: string | null
          price_eur: number
          season: string | null
          slug: string
          sort_order: number
          summary_en: string
          summary_no: string | null
          summary_pt: string | null
          title_en: string
          title_no: string | null
          title_pt: string | null
          updated_at: string
          view_count: number
          what_you_get_en: string
          what_you_get_no: string | null
          what_you_get_pt: string | null
        }
        Insert: {
          audit_report?: string | null
          audited_at?: string | null
          created_at?: string
          description_en?: string
          description_no?: string | null
          description_pt?: string | null
          destination?: string | null
          duration?: string | null
          estimated_trip_budget?: string | null
          experience_type?: string[] | null
          gallery_images?: Json
          group_size_label?: string | null
          hero_image_url?: string | null
          hotels?: Json
          id?: string
          is_published?: boolean
          itinerary_content_en?: string | null
          itinerary_content_no?: string | null
          itinerary_content_pt?: string | null
          pdf_path?: string | null
          price_eur?: number
          season?: string | null
          slug: string
          sort_order?: number
          summary_en?: string
          summary_no?: string | null
          summary_pt?: string | null
          title_en: string
          title_no?: string | null
          title_pt?: string | null
          updated_at?: string
          view_count?: number
          what_you_get_en?: string
          what_you_get_no?: string | null
          what_you_get_pt?: string | null
        }
        Update: {
          audit_report?: string | null
          audited_at?: string | null
          created_at?: string
          description_en?: string
          description_no?: string | null
          description_pt?: string | null
          destination?: string | null
          duration?: string | null
          estimated_trip_budget?: string | null
          experience_type?: string[] | null
          gallery_images?: Json
          group_size_label?: string | null
          hero_image_url?: string | null
          hotels?: Json
          id?: string
          is_published?: boolean
          itinerary_content_en?: string | null
          itinerary_content_no?: string | null
          itinerary_content_pt?: string | null
          pdf_path?: string | null
          price_eur?: number
          season?: string | null
          slug?: string
          sort_order?: number
          summary_en?: string
          summary_no?: string | null
          summary_pt?: string | null
          title_en?: string
          title_no?: string | null
          title_pt?: string | null
          updated_at?: string
          view_count?: number
          what_you_get_en?: string
          what_you_get_no?: string | null
          what_you_get_pt?: string | null
        }
        Relationships: []
      }
      catalog_itinerary_drafts: {
        Row: {
          created_at: string
          draft: Json
          itinerary_id: string
          language: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          draft?: Json
          itinerary_id: string
          language?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          draft?: Json
          itinerary_id?: string
          language?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_itinerary_drafts_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: true
            referencedRelation: "catalog_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_purchases: {
        Row: {
          amount_total: number
          created_at: string
          currency: string
          customer_email: string
          customer_name: string | null
          download_count: number
          download_expires_at: string | null
          download_token: string
          id: string
          itinerary_id: string
          status: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount_total: number
          created_at?: string
          currency?: string
          customer_email: string
          customer_name?: string | null
          download_count?: number
          download_expires_at?: string | null
          download_token?: string
          id?: string
          itinerary_id: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_total?: number
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string | null
          download_count?: number
          download_expires_at?: string | null
          download_token?: string
          id?: string
          itinerary_id?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_purchases_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "catalog_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      client_projects: {
        Row: {
          client_email: string | null
          client_name: string
          cover_tagline: string | null
          created_at: string
          currency: string
          departure: string | null
          destination: string | null
          end_date: string | null
          estimated_budget: string | null
          group_size: number
          hero_image_url: string | null
          id: string
          internal_notes: string | null
          itinerary_content: string | null
          itinerary_pdf_path: string | null
          itinerary_status: string
          notes: string | null
          payment_status: string
          price: number | null
          start_date: string | null
          trip_duration: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          cover_tagline?: string | null
          created_at?: string
          currency?: string
          departure?: string | null
          destination?: string | null
          end_date?: string | null
          estimated_budget?: string | null
          group_size?: number
          hero_image_url?: string | null
          id?: string
          internal_notes?: string | null
          itinerary_content?: string | null
          itinerary_pdf_path?: string | null
          itinerary_status?: string
          notes?: string | null
          payment_status?: string
          price?: number | null
          start_date?: string | null
          trip_duration?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          cover_tagline?: string | null
          created_at?: string
          currency?: string
          departure?: string | null
          destination?: string | null
          end_date?: string | null
          estimated_budget?: string | null
          group_size?: number
          hero_image_url?: string | null
          id?: string
          internal_notes?: string | null
          itinerary_content?: string | null
          itinerary_pdf_path?: string | null
          itinerary_status?: string
          notes?: string | null
          payment_status?: string
          price?: number | null
          start_date?: string | null
          trip_duration?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_suggestions: {
        Row: {
          created_at: string
          destination: string
          details: string | null
          email: string
          experience_type: string | null
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          destination: string
          details?: string | null
          email: string
          experience_type?: string | null
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          destination?: string
          details?: string | null
          email?: string
          experience_type?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      itinerary_drafts: {
        Row: {
          chat_history: Json | null
          content: string
          created_at: string
          id: string
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_history?: Json | null
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_history?: Json | null
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_drafts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      route_maker_itineraries: {
        Row: {
          accommodations: Json | null
          brief_analysis: Json | null
          brief_data: Json
          brief_text: string
          budget: Json | null
          created_at: string
          days: Json | null
          destination: string | null
          duration_label: string | null
          experiences: Json | null
          gallery_images: Json
          hero_image_url: string | null
          id: string
          is_published: boolean
          logistics: Json | null
          packing: Json | null
          pdf_intro: string | null
          price_eur: number
          quality: Json | null
          route: Json | null
          route_approved_at: string | null
          sales_copy: Json | null
          seo: Json | null
          slug: string | null
          sort_order: number
          status: string
          summary: string
          title: string
          updated_at: string
          upsell: string | null
          user_id: string
          view_count: number
        }
        Insert: {
          accommodations?: Json | null
          brief_analysis?: Json | null
          brief_data?: Json
          brief_text?: string
          budget?: Json | null
          created_at?: string
          days?: Json | null
          destination?: string | null
          duration_label?: string | null
          experiences?: Json | null
          gallery_images?: Json
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          logistics?: Json | null
          packing?: Json | null
          pdf_intro?: string | null
          price_eur?: number
          quality?: Json | null
          route?: Json | null
          route_approved_at?: string | null
          sales_copy?: Json | null
          seo?: Json | null
          slug?: string | null
          sort_order?: number
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          upsell?: string | null
          user_id: string
          view_count?: number
        }
        Update: {
          accommodations?: Json | null
          brief_analysis?: Json | null
          brief_data?: Json
          brief_text?: string
          budget?: Json | null
          created_at?: string
          days?: Json | null
          destination?: string | null
          duration_label?: string | null
          experiences?: Json | null
          gallery_images?: Json
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          logistics?: Json | null
          packing?: Json | null
          pdf_intro?: string | null
          price_eur?: number
          quality?: Json | null
          route?: Json | null
          route_approved_at?: string | null
          sales_copy?: Json | null
          seo?: Json | null
          slug?: string | null
          sort_order?: number
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          upsell?: string | null
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      shared_itineraries: {
        Row: {
          client_name: string
          cover_image_url: string | null
          created_at: string
          days: Json
          destination: string | null
          draft_id: string | null
          end_date: string | null
          group_size: number
          id: string
          is_published: boolean
          language: string
          last_viewed_at: string | null
          markdown_content: string
          practical_info: Json
          project_id: string | null
          share_token: string
          start_date: string | null
          trip_duration: string | null
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          client_name: string
          cover_image_url?: string | null
          created_at?: string
          days?: Json
          destination?: string | null
          draft_id?: string | null
          end_date?: string | null
          group_size?: number
          id?: string
          is_published?: boolean
          language?: string
          last_viewed_at?: string | null
          markdown_content?: string
          practical_info?: Json
          project_id?: string | null
          share_token?: string
          start_date?: string | null
          trip_duration?: string | null
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          client_name?: string
          cover_image_url?: string | null
          created_at?: string
          days?: Json
          destination?: string | null
          draft_id?: string | null
          end_date?: string | null
          group_size?: number
          id?: string
          is_published?: boolean
          language?: string
          last_viewed_at?: string | null
          markdown_content?: string
          practical_info?: Json
          project_id?: string | null
          share_token?: string
          start_date?: string | null
          trip_duration?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_itineraries_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "itinerary_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_itineraries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      trip_requests: {
        Row: {
          accommodation_type: string | null
          adults: number
          children_ages: number[] | null
          children_count: number
          client_email: string
          client_name: string
          created_at: string
          departure: string | null
          destination: string | null
          dietary_restrictions: string | null
          end_date: string | null
          estimated_budget: string | null
          group_size: number
          id: string
          interests: string[] | null
          language: string
          mobility_notes: string | null
          must_have_experiences: string | null
          notes: string | null
          phone: string | null
          start_date: string | null
          status: string
          travel_pace: string | null
          trip_duration: string | null
          updated_at: string
          visited_before: boolean | null
        }
        Insert: {
          accommodation_type?: string | null
          adults?: number
          children_ages?: number[] | null
          children_count?: number
          client_email: string
          client_name: string
          created_at?: string
          departure?: string | null
          destination?: string | null
          dietary_restrictions?: string | null
          end_date?: string | null
          estimated_budget?: string | null
          group_size?: number
          id?: string
          interests?: string[] | null
          language?: string
          mobility_notes?: string | null
          must_have_experiences?: string | null
          notes?: string | null
          phone?: string | null
          start_date?: string | null
          status?: string
          travel_pace?: string | null
          trip_duration?: string | null
          updated_at?: string
          visited_before?: boolean | null
        }
        Update: {
          accommodation_type?: string | null
          adults?: number
          children_ages?: number[] | null
          children_count?: number
          client_email?: string
          client_name?: string
          created_at?: string
          departure?: string | null
          destination?: string | null
          dietary_restrictions?: string | null
          end_date?: string | null
          estimated_budget?: string | null
          group_size?: number
          id?: string
          interests?: string[] | null
          language?: string
          mobility_notes?: string | null
          must_have_experiences?: string | null
          notes?: string | null
          phone?: string | null
          start_date?: string | null
          status?: string
          travel_pace?: string | null
          trip_duration?: string | null
          updated_at?: string
          visited_before?: boolean | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_catalog_sales_counts: {
        Args: never
        Returns: {
          itinerary_id: string
          sales_count: number
        }[]
      }
      get_purchase_by_token: {
        Args: { _token: string }
        Returns: {
          amount_total: number
          currency: string
          customer_email: string
          download_expires_at: string
          id: string
          itinerary_id: string
          itinerary_slug: string
          itinerary_title: string
          status: string
        }[]
      }
      get_shared_itinerary: {
        Args: { _token: string }
        Returns: {
          client_first_name: string
          cover_image_url: string
          days: Json
          destination: string
          end_date: string
          group_size: number
          id: string
          language: string
          markdown_content: string
          practical_info: Json
          share_token: string
          start_date: string
          trip_duration: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_catalog_view: { Args: { _slug: string }; Returns: undefined }
      increment_itinerary_view: { Args: { _token: string }; Returns: undefined }
      increment_route_maker_view: {
        Args: { _slug: string }
        Returns: undefined
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "user"
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
      app_role: ["admin", "staff", "user"],
    },
  },
} as const
