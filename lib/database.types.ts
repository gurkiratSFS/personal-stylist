export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      appearance_profiles: {
        Row: {
          age_range: string | null;
          created_at: string;
          gender_presentation: string | null;
          grooming_preferences: string[];
          hair_type: string | null;
          height_cm: number | null;
          id: string;
          preferred_hairstyles: string[];
          proportion_notes: string | null;
          skin_undertone_preference: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          age_range?: string | null;
          created_at?: string;
          gender_presentation?: string | null;
          grooming_preferences?: string[];
          hair_type?: string | null;
          height_cm?: number | null;
          id?: string;
          preferred_hairstyles?: string[];
          proportion_notes?: string | null;
          skin_undertone_preference?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          age_range?: string | null;
          created_at?: string;
          gender_presentation?: string | null;
          grooming_preferences?: string[];
          hair_type?: string | null;
          height_cm?: number | null;
          id?: string;
          preferred_hairstyles?: string[];
          proportion_notes?: string | null;
          skin_undertone_preference?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          country: string | null;
          created_at: string;
          currency: string | null;
          display_name: string | null;
          id: string;
          language: string | null;
          timezone: string | null;
          updated_at: string;
        };
        Insert: {
          country?: string | null;
          created_at?: string;
          currency?: string | null;
          display_name?: string | null;
          id: string;
          language?: string | null;
          timezone?: string | null;
          updated_at?: string;
        };
        Update: {
          country?: string | null;
          created_at?: string;
          currency?: string | null;
          display_name?: string | null;
          id?: string;
          language?: string | null;
          timezone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      style_profiles: {
        Row: {
          budget_band: string | null;
          climate: string | null;
          created_at: string;
          disliked_colors: string[];
          fashion_categories: string[];
          favorite_colors: string[];
          fit_notes: string | null;
          fit_preferences: string[];
          goals: string | null;
          grooming_notes: string | null;
          id: string;
          lifestyle: string | null;
          onboarding_completed_at: string | null;
          onboarding_skipped_at: string | null;
          palette_notes: string | null;
          preferred_styles: string[];
          shopping_notes: string | null;
          summary: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          budget_band?: string | null;
          climate?: string | null;
          created_at?: string;
          disliked_colors?: string[];
          fashion_categories?: string[];
          favorite_colors?: string[];
          fit_notes?: string | null;
          fit_preferences?: string[];
          goals?: string | null;
          grooming_notes?: string | null;
          id?: string;
          lifestyle?: string | null;
          onboarding_completed_at?: string | null;
          onboarding_skipped_at?: string | null;
          palette_notes?: string | null;
          preferred_styles?: string[];
          shopping_notes?: string | null;
          summary?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          budget_band?: string | null;
          climate?: string | null;
          created_at?: string;
          disliked_colors?: string[];
          fashion_categories?: string[];
          favorite_colors?: string[];
          fit_notes?: string | null;
          fit_preferences?: string[];
          goals?: string | null;
          grooming_notes?: string | null;
          id?: string;
          lifestyle?: string | null;
          onboarding_completed_at?: string | null;
          onboarding_skipped_at?: string | null;
          palette_notes?: string | null;
          preferred_styles?: string[];
          shopping_notes?: string | null;
          summary?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_photos: {
        Row: {
          bytes: number | null;
          consent_ai_processing: string;
          consent_recorded_at: string;
          consent_storage: boolean;
          created_at: string;
          height: number | null;
          id: string;
          mime_type: string | null;
          photo_type: string;
          storage_path: string;
          updated_at: string;
          user_id: string;
          width: number | null;
        };
        Insert: {
          bytes?: number | null;
          consent_ai_processing?: string;
          consent_recorded_at?: string;
          consent_storage: boolean;
          created_at?: string;
          height?: number | null;
          id?: string;
          mime_type?: string | null;
          photo_type: string;
          storage_path: string;
          updated_at?: string;
          user_id: string;
          width?: number | null;
        };
        Update: {
          bytes?: number | null;
          consent_ai_processing?: string;
          consent_recorded_at?: string;
          consent_storage?: boolean;
          created_at?: string;
          height?: number | null;
          id?: string;
          mime_type?: string | null;
          photo_type?: string;
          storage_path?: string;
          updated_at?: string;
          user_id?: string;
          width?: number | null;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          created_at: string;
          id: string;
          preference_key: string;
          preference_value: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          preference_key: string;
          preference_value?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          preference_key?: string;
          preference_value?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
