
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "ai_jobs": {
                  Row: {
                    "completed_at": string | null,"created_at": string,"error": string | null,"id": string,"input_reference": NonNullable<Json>,"job_type": string,"result_reference": Json | null,"started_at": string | null,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"created_at"?: string,"error"?: string | null,"id"?: string,"input_reference"?: NonNullable<Json>,"job_type": string,"result_reference"?: Json | null,"started_at"?: string | null,"status"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "completed_at"?: string | null,"created_at"?: string,"error"?: string | null,"id"?: string,"input_reference"?: NonNullable<Json>,"job_type"?: string,"result_reference"?: Json | null,"started_at"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"ai_usage": {
                  Row: {
                    "cost_usd": number | null,"created_at": string,"id": string,"job_id": string | null,"model": string,"operation": string,"output_tokens": number | null,"prompt_tokens": number | null,"provider": string,"usage_metadata": NonNullable<Json>,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cost_usd"?: number | null,"created_at"?: string,"id"?: string,"job_id"?: string | null,"model": string,"operation": string,"output_tokens"?: number | null,"prompt_tokens"?: number | null,"provider": string,"usage_metadata"?: NonNullable<Json>,"user_id": string
                  }
                  Update: {
                    "cost_usd"?: number | null,"created_at"?: string,"id"?: string,"job_id"?: string | null,"model"?: string,"operation"?: string,"output_tokens"?: number | null,"prompt_tokens"?: number | null,"provider"?: string,"usage_metadata"?: NonNullable<Json>,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_usage_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "ai_jobs"
      referencedColumns: ["id"]
    }
                  ]
                },"appearance_profiles": {
                  Row: {
                    "age_range": string | null,"created_at": string,"gender_presentation": string | null,"grooming_preferences": (string)[],"hair_type": string | null,"height_cm": number | null,"id": string,"preferred_hairstyles": (string)[],"proportion_notes": string | null,"skin_undertone_preference": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "age_range"?: string | null,"created_at"?: string,"gender_presentation"?: string | null,"grooming_preferences"?: (string)[],"hair_type"?: string | null,"height_cm"?: number | null,"id"?: string,"preferred_hairstyles"?: (string)[],"proportion_notes"?: string | null,"skin_undertone_preference"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "age_range"?: string | null,"created_at"?: string,"gender_presentation"?: string | null,"grooming_preferences"?: (string)[],"hair_type"?: string | null,"height_cm"?: number | null,"id"?: string,"preferred_hairstyles"?: (string)[],"proportion_notes"?: string | null,"skin_undertone_preference"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"outfit_calendar": {
                  Row: {
                    "combination_id": string,"created_at": string,"id": string,"notes": string | null,"scheduled_date": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "combination_id": string,"created_at"?: string,"id"?: string,"notes"?: string | null,"scheduled_date": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "combination_id"?: string,"created_at"?: string,"id"?: string,"notes"?: string | null,"scheduled_date"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "outfit_calendar_combination_id_fkey"
      columns: ["combination_id"]
isOneToOne: false
      referencedRelation: "outfit_combinations"
      referencedColumns: ["id"]
    }
                  ]
                },"outfit_combination_items": {
                  Row: {
                    "combination_id": string,"created_at": string,"id": string,"sort_order": number,"user_id": string,"wardrobe_item_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "combination_id": string,"created_at"?: string,"id"?: string,"sort_order"?: number,"user_id": string,"wardrobe_item_id": string
                  }
                  Update: {
                    "combination_id"?: string,"created_at"?: string,"id"?: string,"sort_order"?: number,"user_id"?: string,"wardrobe_item_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "outfit_combination_items_combination_id_fkey"
      columns: ["combination_id"]
isOneToOne: false
      referencedRelation: "outfit_combinations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "outfit_combination_items_wardrobe_item_id_fkey"
      columns: ["wardrobe_item_id"]
isOneToOne: false
      referencedRelation: "wardrobe_items"
      referencedColumns: ["id"]
    }
                  ]
                },"outfit_combinations": {
                  Row: {
                    "created_at": string,"id": string,"is_favorite": boolean,"job_id": string | null,"notes": string | null,"occasion": string | null,"source": string,"title": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_favorite"?: boolean,"job_id"?: string | null,"notes"?: string | null,"occasion"?: string | null,"source"?: string,"title": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_favorite"?: boolean,"job_id"?: string | null,"notes"?: string | null,"occasion"?: string | null,"source"?: string,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "outfit_combinations_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "ai_jobs"
      referencedColumns: ["id"]
    }
                  ]
                },"outfit_analyses": {
                  Row: {
                    "category_scores": NonNullable<Json>,"confidence": string,"created_at": string,"feedback_depth": string,"id": string,"improvements": (string)[],"job_id": string | null,"model_name": string,"model_provider": string,"model_version": string | null,"outfit_id": string,"overall_score": number,"strengths": (string)[],"summary": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_scores": NonNullable<Json>,"confidence": string,"created_at"?: string,"feedback_depth": string,"id"?: string,"improvements"?: (string)[],"job_id"?: string | null,"model_name": string,"model_provider": string,"model_version"?: string | null,"outfit_id": string,"overall_score": number,"strengths"?: (string)[],"summary": string,"user_id": string
                  }
                  Update: {
                    "category_scores"?: NonNullable<Json>,"confidence"?: string,"created_at"?: string,"feedback_depth"?: string,"id"?: string,"improvements"?: (string)[],"job_id"?: string | null,"model_name"?: string,"model_provider"?: string,"model_version"?: string | null,"outfit_id"?: string,"overall_score"?: number,"strengths"?: (string)[],"summary"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "outfit_analyses_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "ai_jobs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "outfit_analyses_outfit_id_fkey"
      columns: ["outfit_id"]
isOneToOne: false
      referencedRelation: "outfits"
      referencedColumns: ["id"]
    }
                  ]
                },"outfit_follow_ups": {
                  Row: {
                    "analysis_id": string,"answer": string | null,"created_at": string,"id": string,"job_id": string | null,"question": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "analysis_id": string,"answer"?: string | null,"created_at"?: string,"id"?: string,"job_id"?: string | null,"question": string,"user_id": string
                  }
                  Update: {
                    "analysis_id"?: string,"answer"?: string | null,"created_at"?: string,"id"?: string,"job_id"?: string | null,"question"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "outfit_follow_ups_analysis_id_fkey"
      columns: ["analysis_id"]
isOneToOne: false
      referencedRelation: "outfit_analyses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "outfit_follow_ups_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "ai_jobs"
      referencedColumns: ["id"]
    }
                  ]
                },"outfit_recommendations": {
                  Row: {
                    "analysis_id": string,"content": string,"created_at": string,"id": string,"rank": number,"recommendation_type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "analysis_id": string,"content": string,"created_at"?: string,"id"?: string,"rank"?: number,"recommendation_type": string,"user_id": string
                  }
                  Update: {
                    "analysis_id"?: string,"content"?: string,"created_at"?: string,"id"?: string,"rank"?: number,"recommendation_type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "outfit_recommendations_analysis_id_fkey"
      columns: ["analysis_id"]
isOneToOne: false
      referencedRelation: "outfit_analyses"
      referencedColumns: ["id"]
    }
                  ]
                },"outfits": {
                  Row: {
                    "bytes": number | null,"consent_ai_processing": string,"consent_storage": boolean,"created_at": string,"id": string,"image_path": string,"mime_type": string | null,"notes": string | null,"occasion": string | null,"source": string,"status": string,"title": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bytes"?: number | null,"consent_ai_processing"?: string,"consent_storage"?: boolean,"created_at"?: string,"id"?: string,"image_path": string,"mime_type"?: string | null,"notes"?: string | null,"occasion"?: string | null,"source"?: string,"status"?: string,"title"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "bytes"?: number | null,"consent_ai_processing"?: string,"consent_storage"?: boolean,"created_at"?: string,"id"?: string,"image_path"?: string,"mime_type"?: string | null,"notes"?: string | null,"occasion"?: string | null,"source"?: string,"status"?: string,"title"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "country": string | null,"created_at": string,"currency": string | null,"display_name": string | null,"id": string,"language": string | null,"timezone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "country"?: string | null,"created_at"?: string,"currency"?: string | null,"display_name"?: string | null,"id": string,"language"?: string | null,"timezone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "country"?: string | null,"created_at"?: string,"currency"?: string | null,"display_name"?: string | null,"id"?: string,"language"?: string | null,"timezone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"saved_looks": {
                  Row: {
                    "created_at": string,"id": string,"notes": string | null,"outfit_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"notes"?: string | null,"outfit_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"notes"?: string | null,"outfit_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_looks_outfit_id_fkey"
      columns: ["outfit_id"]
isOneToOne: false
      referencedRelation: "outfits"
      referencedColumns: ["id"]
    }
                  ]
                },"style_profiles": {
                  Row: {
                    "budget_band": string | null,"climate": string | null,"created_at": string,"disliked_colors": (string)[],"fashion_categories": (string)[],"favorite_colors": (string)[],"fit_notes": string | null,"fit_preferences": (string)[],"goals": string | null,"grooming_notes": string | null,"id": string,"lifestyle": string | null,"onboarding_completed_at": string | null,"onboarding_skipped_at": string | null,"palette_notes": string | null,"preferred_styles": (string)[],"shopping_notes": string | null,"summary": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "budget_band"?: string | null,"climate"?: string | null,"created_at"?: string,"disliked_colors"?: (string)[],"fashion_categories"?: (string)[],"favorite_colors"?: (string)[],"fit_notes"?: string | null,"fit_preferences"?: (string)[],"goals"?: string | null,"grooming_notes"?: string | null,"id"?: string,"lifestyle"?: string | null,"onboarding_completed_at"?: string | null,"onboarding_skipped_at"?: string | null,"palette_notes"?: string | null,"preferred_styles"?: (string)[],"shopping_notes"?: string | null,"summary"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "budget_band"?: string | null,"climate"?: string | null,"created_at"?: string,"disliked_colors"?: (string)[],"fashion_categories"?: (string)[],"favorite_colors"?: (string)[],"fit_notes"?: string | null,"fit_preferences"?: (string)[],"goals"?: string | null,"grooming_notes"?: string | null,"id"?: string,"lifestyle"?: string | null,"onboarding_completed_at"?: string | null,"onboarding_skipped_at"?: string | null,"palette_notes"?: string | null,"preferred_styles"?: (string)[],"shopping_notes"?: string | null,"summary"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"wardrobe_item_attributes": {
                  Row: {
                    "attribute_key": string,"attribute_value": string,"created_at": string,"id": string,"item_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attribute_key": string,"attribute_value": string,"created_at"?: string,"id"?: string,"item_id": string,"user_id": string
                  }
                  Update: {
                    "attribute_key"?: string,"attribute_value"?: string,"created_at"?: string,"id"?: string,"item_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wardrobe_item_attributes_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "wardrobe_items"
      referencedColumns: ["id"]
    }
                  ]
                },"wardrobe_items": {
                  Row: {
                    "brand": string | null,"bytes": number | null,"categorize_job_id": string | null,"category": string | null,"color": string | null,"consent_ai_processing": string,"consent_storage": boolean,"created_at": string,"id": string,"image_path": string,"mime_type": string | null,"name": string | null,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand"?: string | null,"bytes"?: number | null,"categorize_job_id"?: string | null,"category"?: string | null,"color"?: string | null,"consent_ai_processing"?: string,"consent_storage"?: boolean,"created_at"?: string,"id"?: string,"image_path": string,"mime_type"?: string | null,"name"?: string | null,"status"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "brand"?: string | null,"bytes"?: number | null,"categorize_job_id"?: string | null,"category"?: string | null,"color"?: string | null,"consent_ai_processing"?: string,"consent_storage"?: boolean,"created_at"?: string,"id"?: string,"image_path"?: string,"mime_type"?: string | null,"name"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wardrobe_items_categorize_job_id_fkey"
      columns: ["categorize_job_id"]
isOneToOne: false
      referencedRelation: "ai_jobs"
      referencedColumns: ["id"]
    }
                  ]
                },"user_photos": {
                  Row: {
                    "bytes": number | null,"consent_ai_processing": string,"consent_recorded_at": string,"consent_storage": boolean,"created_at": string,"height": number | null,"id": string,"mime_type": string | null,"photo_type": string,"storage_path": string,"updated_at": string,"user_id": string,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bytes"?: number | null,"consent_ai_processing"?: string,"consent_recorded_at"?: string,"consent_storage": boolean,"created_at"?: string,"height"?: number | null,"id"?: string,"mime_type"?: string | null,"photo_type": string,"storage_path": string,"updated_at"?: string,"user_id": string,"width"?: number | null
                  }
                  Update: {
                    "bytes"?: number | null,"consent_ai_processing"?: string,"consent_recorded_at"?: string,"consent_storage"?: boolean,"created_at"?: string,"height"?: number | null,"id"?: string,"mime_type"?: string | null,"photo_type"?: string,"storage_path"?: string,"updated_at"?: string,"user_id"?: string,"width"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"user_preferences": {
                  Row: {
                    "created_at": string,"id": string,"preference_key": string,"preference_value": NonNullable<Json>,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"preference_key": string,"preference_value"?: NonNullable<Json>,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"preference_key"?: string,"preference_value"?: NonNullable<Json>,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
