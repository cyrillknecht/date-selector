export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cards: {
        Row: {
          created_at: string
          decision_module_id: string
          description: string | null
          id: string
          location: string | null
          mood_tags: string[]
          photo_urls: string[]
          position: number
          price_range: string | null
          title: string
        }
        Insert: {
          created_at?: string
          decision_module_id: string
          description?: string | null
          id?: string
          location?: string | null
          mood_tags?: string[]
          photo_urls?: string[]
          position: number
          price_range?: string | null
          title: string
        }
        Update: {
          created_at?: string
          decision_module_id?: string
          description?: string | null
          id?: string
          location?: string | null
          mood_tags?: string[]
          photo_urls?: string[]
          position?: number
          price_range?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_decision_module_id_fkey"
            columns: ["decision_module_id"]
            isOneToOne: false
            referencedRelation: "decision_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_modules: {
        Row: {
          allow_multi_select: boolean
          created_at: string
          flow_id: string
          id: string
          position: number
          prompt_text: string
        }
        Insert: {
          allow_multi_select?: boolean
          created_at?: string
          flow_id: string
          id?: string
          position: number
          prompt_text: string
        }
        Update: {
          allow_multi_select?: boolean
          created_at?: string
          flow_id?: string
          id?: string
          position?: number
          prompt_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_modules_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flows: {
        Row: {
          archived_at: string | null
          confirmed_at: string | null
          confirmed_card_id: string | null
          created_at: string
          id: string
          intro_message: string | null
          meeting_point: string | null
          outro_message: string | null
          published_at: string | null
          status: string
          title: string
          token: string | null
        }
        Insert: {
          archived_at?: string | null
          confirmed_at?: string | null
          confirmed_card_id?: string | null
          created_at?: string
          id?: string
          intro_message?: string | null
          meeting_point?: string | null
          outro_message?: string | null
          published_at?: string | null
          status?: string
          title: string
          token?: string | null
        }
        Update: {
          archived_at?: string | null
          confirmed_at?: string | null
          confirmed_card_id?: string | null
          created_at?: string
          id?: string
          intro_message?: string | null
          meeting_point?: string | null
          outro_message?: string | null
          published_at?: string | null
          status?: string
          title?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flows_confirmed_card_id_fkey"
            columns: ["confirmed_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_modules: {
        Row: {
          created_at: string
          flow_id: string
          id: string
          position: number
          title: string
        }
        Insert: {
          created_at?: string
          flow_id: string
          id?: string
          position: number
          title: string
        }
        Update: {
          created_at?: string
          flow_id?: string
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_modules_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: string
          options: string[]
          position: number
          question_text: string
          quiz_module_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          options: string[]
          position: number
          question_text: string
          quiz_module_id: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: string[]
          position?: number
          question_text?: string
          quiz_module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_module_id_fkey"
            columns: ["quiz_module_id"]
            isOneToOne: false
            referencedRelation: "quiz_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      selection_answers: {
        Row: {
          chosen_card_ids: string[] | null
          chosen_option_text: string | null
          id: string
          module_id: string
          module_type: string
          selection_id: string
        }
        Insert: {
          chosen_card_ids?: string[] | null
          chosen_option_text?: string | null
          id?: string
          module_id: string
          module_type: string
          selection_id: string
        }
        Update: {
          chosen_card_ids?: string[] | null
          chosen_option_text?: string | null
          id?: string
          module_id?: string
          module_type?: string
          selection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "selection_answers_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "selections"
            referencedColumns: ["id"]
          },
        ]
      }
      selections: {
        Row: {
          flow_id: string
          id: string
          message: string | null
          submitted_at: string
        }
        Insert: {
          flow_id: string
          id?: string
          message?: string | null
          submitted_at?: string
        }
        Update: {
          flow_id?: string
          id?: string
          message?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "selections_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

