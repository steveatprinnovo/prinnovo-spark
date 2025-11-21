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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agenda_items: {
        Row: {
          created_at: string
          id: string
          item: string
          presenter: string
          sort_order: number
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item?: string
          presenter?: string
          sort_order?: number
          time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item?: string
          presenter?: string
          sort_order?: number
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      board_approvals: {
        Row: {
          annual_subscription_cost: number | null
          company_title: string
          created_at: string | null
          excel_storage_path: string | null
          first_year_cost: number | null
          id: string
          internal_champions: string | null
          ipa_terms: string | null
          it_needs_pilot: string | null
          key_points: string | null
          logo_storage_path: string | null
          one_time_implementation_cost: number | null
          post_pilot: string | null
          ready_to_present: boolean
          referral_incentive: string | null
          updated_at: string | null
          user_id: string
          validation: string | null
          value_impact_team: string | null
        }
        Insert: {
          annual_subscription_cost?: number | null
          company_title: string
          created_at?: string | null
          excel_storage_path?: string | null
          first_year_cost?: number | null
          id?: string
          internal_champions?: string | null
          ipa_terms?: string | null
          it_needs_pilot?: string | null
          key_points?: string | null
          logo_storage_path?: string | null
          one_time_implementation_cost?: number | null
          post_pilot?: string | null
          ready_to_present?: boolean
          referral_incentive?: string | null
          updated_at?: string | null
          user_id: string
          validation?: string | null
          value_impact_team?: string | null
        }
        Update: {
          annual_subscription_cost?: number | null
          company_title?: string
          created_at?: string | null
          excel_storage_path?: string | null
          first_year_cost?: number | null
          id?: string
          internal_champions?: string | null
          ipa_terms?: string | null
          it_needs_pilot?: string | null
          key_points?: string | null
          logo_storage_path?: string | null
          one_time_implementation_cost?: number | null
          post_pilot?: string | null
          ready_to_present?: boolean
          referral_incentive?: string | null
          updated_at?: string | null
          user_id?: string
          validation?: string | null
          value_impact_team?: string | null
        }
        Relationships: []
      }
      "Company Detail": {
        Row: {
          Champions: string | null
          "Company Contact": string | null
          "Company Description": string | null
          "Company Name": string
          "Country of Origin": string | null
          "Current Company Valuation": number | null
          "Current HLV Valuation": number | null
          "Data Monetization Dollars": number | null
          "Data Monetization Forecast": number | null
          "EVP Owner": string | null
          "Final Portfolio Decision Date": string | null
          "High-Level Focus Area": string | null
          "HLV Ownership Percentage": string | null
          imgurl: string | null
          "Implementation Completion Date": string | null
          "Intro Origin": string | null
          "Invested Amount": number | null
          "Invested Amount Date": string | null
          "Invested Amount Round": string | null
          "Invested Amount Valuation": number | null
          "Invested Amount Valuation Date": string | null
          "Investment Tracker Stage": string | null
          "IPA Signature Date": string | null
          "IPA Year": number | null
          "Pipeline Stage": string | null
          "Specific Focus Area": string | null
          "Target Cash Investment Return": number | null
          "Target IPA Return": number | null
          "Term Sheet Signature Date": string | null
          "Total Enterprise Value Captured": number | null
          venture_office: string | null
        }
        Insert: {
          Champions?: string | null
          "Company Contact"?: string | null
          "Company Description"?: string | null
          "Company Name": string
          "Country of Origin"?: string | null
          "Current Company Valuation"?: number | null
          "Current HLV Valuation"?: number | null
          "Data Monetization Dollars"?: number | null
          "Data Monetization Forecast"?: number | null
          "EVP Owner"?: string | null
          "Final Portfolio Decision Date"?: string | null
          "High-Level Focus Area"?: string | null
          "HLV Ownership Percentage"?: string | null
          imgurl?: string | null
          "Implementation Completion Date"?: string | null
          "Intro Origin"?: string | null
          "Invested Amount"?: number | null
          "Invested Amount Date"?: string | null
          "Invested Amount Round"?: string | null
          "Invested Amount Valuation"?: number | null
          "Invested Amount Valuation Date"?: string | null
          "Investment Tracker Stage"?: string | null
          "IPA Signature Date"?: string | null
          "IPA Year"?: number | null
          "Pipeline Stage"?: string | null
          "Specific Focus Area"?: string | null
          "Target Cash Investment Return"?: number | null
          "Target IPA Return"?: number | null
          "Term Sheet Signature Date"?: string | null
          "Total Enterprise Value Captured"?: number | null
          venture_office?: string | null
        }
        Update: {
          Champions?: string | null
          "Company Contact"?: string | null
          "Company Description"?: string | null
          "Company Name"?: string
          "Country of Origin"?: string | null
          "Current Company Valuation"?: number | null
          "Current HLV Valuation"?: number | null
          "Data Monetization Dollars"?: number | null
          "Data Monetization Forecast"?: number | null
          "EVP Owner"?: string | null
          "Final Portfolio Decision Date"?: string | null
          "High-Level Focus Area"?: string | null
          "HLV Ownership Percentage"?: string | null
          imgurl?: string | null
          "Implementation Completion Date"?: string | null
          "Intro Origin"?: string | null
          "Invested Amount"?: number | null
          "Invested Amount Date"?: string | null
          "Invested Amount Round"?: string | null
          "Invested Amount Valuation"?: number | null
          "Invested Amount Valuation Date"?: string | null
          "Investment Tracker Stage"?: string | null
          "IPA Signature Date"?: string | null
          "IPA Year"?: number | null
          "Pipeline Stage"?: string | null
          "Specific Focus Area"?: string | null
          "Target Cash Investment Return"?: number | null
          "Target IPA Return"?: number | null
          "Term Sheet Signature Date"?: string | null
          "Total Enterprise Value Captured"?: number | null
          venture_office?: string | null
        }
        Relationships: []
      }
      status_notes: {
        Row: {
          company_name: string
          created_at: string
          id: string
          status_note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          status_note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          status_note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_venture_offices: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          venture_office: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          venture_office: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          venture_office?: string
        }
        Relationships: []
      }
      venture_office_detail: {
        Row: {
          "Companies Evaluated": number | null
          created_at: string
          id: number
          "Investment Allotment": number | null
          "IPA Negotiations": number | null
          "Prinnovo Health Ownership": string | null
          "Qualified Leads": number | null
          "Term Sheet Negotiations": number | null
          "Venture Office Logo": string | null
          "Venture Office Name": string | null
        }
        Insert: {
          "Companies Evaluated"?: number | null
          created_at?: string
          id?: number
          "Investment Allotment"?: number | null
          "IPA Negotiations"?: number | null
          "Prinnovo Health Ownership"?: string | null
          "Qualified Leads"?: number | null
          "Term Sheet Negotiations"?: number | null
          "Venture Office Logo"?: string | null
          "Venture Office Name"?: string | null
        }
        Update: {
          "Companies Evaluated"?: number | null
          created_at?: string
          id?: number
          "Investment Allotment"?: number | null
          "IPA Negotiations"?: number | null
          "Prinnovo Health Ownership"?: string | null
          "Qualified Leads"?: number | null
          "Term Sheet Negotiations"?: number | null
          "Venture Office Logo"?: string | null
          "Venture Office Name"?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_venture_office: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
