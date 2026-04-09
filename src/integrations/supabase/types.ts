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
      academy_lessons: {
        Row: {
          content: string
          created_at: string
          description: string | null
          id: string
          lesson_number: number
          lesson_slug: string
          module_number: number
          module_slug: string
          module_title: string
          reading_time_minutes: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          lesson_number: number
          lesson_slug: string
          module_number: number
          module_slug: string
          module_title: string
          reading_time_minutes?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          lesson_number?: number
          lesson_slug?: string
          module_number?: number
          module_slug?: string
          module_title?: string
          reading_time_minutes?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      geo_rating: {
        Row: {
          category: string
          created_at: string | null
          direct_score: number
          display_name: string
          domain: string
          errors_count: number
          has_faqpage: boolean
          has_llms_txt: boolean
          has_schema: boolean
          id: string
          last_checked_at: string | null
          llm_score: number
          schema_score: number
          seo_score: number
          top_errors: Json | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          direct_score?: number
          display_name: string
          domain: string
          errors_count?: number
          has_faqpage?: boolean
          has_llms_txt?: boolean
          has_schema?: boolean
          id?: string
          last_checked_at?: string | null
          llm_score?: number
          schema_score?: number
          seo_score?: number
          top_errors?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          direct_score?: number
          display_name?: string
          domain?: string
          errors_count?: number
          has_faqpage?: boolean
          has_llms_txt?: boolean
          has_schema?: boolean
          id?: string
          last_checked_at?: string | null
          llm_score?: number
          schema_score?: number
          seo_score?: number
          top_errors?: Json | null
        }
        Relationships: []
      }
      geo_rating_nominations: {
        Row: {
          category: string
          created_at: string
          display_name: string
          domain: string
          email: string | null
          id: string
          scan_id: string | null
          status: string
          total_score: number
        }
        Insert: {
          category?: string
          created_at?: string
          display_name: string
          domain: string
          email?: string | null
          id?: string
          scan_id?: string | null
          status?: string
          total_score?: number
        }
        Update: {
          category?: string
          created_at?: string
          display_name?: string
          domain?: string
          email?: string | null
          id?: string
          scan_id?: string | null
          status?: string
          total_score?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          docx_path: string | null
          download_token: string
          email: string
          id: string
          keywords_csv_path: string | null
          minus_words_csv_path: string | null
          payment_id: string | null
          payment_status: string
          pdf_path: string | null
          scan_id: string
        }
        Insert: {
          created_at?: string
          docx_path?: string | null
          download_token?: string
          email: string
          id?: string
          keywords_csv_path?: string | null
          minus_words_csv_path?: string | null
          payment_id?: string | null
          payment_status?: string
          pdf_path?: string | null
          scan_id: string
        }
        Update: {
          created_at?: string
          docx_path?: string | null
          download_token?: string
          email?: string
          id?: string
          keywords_csv_path?: string | null
          minus_words_csv_path?: string | null
          payment_id?: string | null
          payment_status?: string
          pdf_path?: string | null
          scan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_rules: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          example_fix: string | null
          fix_template: string | null
          how_to_check: string | null
          id: string
          last_triggered_at: string | null
          module: string
          rule_id: string | null
          score_weight: number
          severity: string
          source: string
          title: string
          trigger_count: number
          visible_in_preview: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          example_fix?: string | null
          fix_template?: string | null
          how_to_check?: string | null
          id?: string
          last_triggered_at?: string | null
          module: string
          rule_id?: string | null
          score_weight?: number
          severity: string
          source?: string
          title: string
          trigger_count?: number
          visible_in_preview?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          example_fix?: string | null
          fix_template?: string | null
          how_to_check?: string | null
          id?: string
          last_triggered_at?: string | null
          module?: string
          rule_id?: string | null
          score_weight?: number
          severity?: string
          source?: string
          title?: string
          trigger_count?: number
          visible_in_preview?: boolean
        }
        Relationships: []
      }
      scans: {
        Row: {
          competitors: Json | null
          crawled_pages: Json | null
          created_at: string
          error_message: string | null
          expires_at: string
          id: string
          is_spa: boolean | null
          issues: Json | null
          keywords: Json | null
          llm_judge: Json | null
          minus_words: Json | null
          mode: string
          progress_pct: number
          raw_html: string | null
          scores: Json | null
          seo_data: Json | null
          status: string
          theme: string | null
          url: string
        }
        Insert: {
          competitors?: Json | null
          crawled_pages?: Json | null
          created_at?: string
          error_message?: string | null
          expires_at?: string
          id?: string
          is_spa?: boolean | null
          issues?: Json | null
          keywords?: Json | null
          llm_judge?: Json | null
          minus_words?: Json | null
          mode?: string
          progress_pct?: number
          raw_html?: string | null
          scores?: Json | null
          seo_data?: Json | null
          status?: string
          theme?: string | null
          url: string
        }
        Update: {
          competitors?: Json | null
          crawled_pages?: Json | null
          created_at?: string
          error_message?: string | null
          expires_at?: string
          id?: string
          is_spa?: boolean | null
          issues?: Json | null
          keywords?: Json | null
          llm_judge?: Json | null
          minus_words?: Json | null
          mode?: string
          progress_pct?: number
          raw_html?: string | null
          scores?: Json | null
          seo_data?: Json | null
          status?: string
          theme?: string | null
          url?: string
        }
        Relationships: []
      }
      tech_stack_cache: {
        Row: {
          data_json: Json
          domain: string
          id: string
          scanned_at: string
        }
        Insert: {
          data_json?: Json
          domain: string
          id?: string
          scanned_at?: string
        }
        Update: {
          data_json?: Json
          domain?: string
          id?: string
          scanned_at?: string
        }
        Relationships: []
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
