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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      article_group_tags: {
        Row: {
          article_id: string
          created_at: string | null
          tag_id: number
        }
        Insert: {
          article_id: string
          created_at?: string | null
          tag_id: number
        }
        Update: {
          article_id?: string
          created_at?: string | null
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_group_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_group_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      article_media: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          media_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          media_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_media_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tags: {
        Row: {
          article_id: string
          created_at: string
          tag_id: number
        }
        Insert: {
          article_id: string
          created_at?: string
          tag_id: number
        }
        Update: {
          article_id?: string
          created_at?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      article_translations: {
        Row: {
          article_id: string | null
          author_id: string | null
          category_id: number | null
          content: string
          content_json: Json | null
          created_at: string | null
          event_date_gregorian: string | null
          event_date_hijri: string | null
          event_date_hijri_year: number | null
          event_date_precision: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_original: boolean
          language: string
          published_at: string | null
          slug: string
          status: string
          summary: string
          title: string
          updated_at: string | null
          views: number
        }
        Insert: {
          article_id?: string | null
          author_id?: string | null
          category_id?: number | null
          content: string
          content_json?: Json | null
          created_at?: string | null
          event_date_gregorian?: string | null
          event_date_hijri?: string | null
          event_date_hijri_year?: number | null
          event_date_precision?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_original?: boolean
          language?: string
          published_at?: string | null
          slug: string
          status: string
          summary: string
          title: string
          updated_at?: string | null
          views?: number
        }
        Update: {
          article_id?: string | null
          author_id?: string | null
          category_id?: number | null
          content?: string
          content_json?: Json | null
          created_at?: string | null
          event_date_gregorian?: string | null
          event_date_hijri?: string | null
          event_date_hijri_year?: number | null
          event_date_precision?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_original?: boolean
          language?: string
          published_at?: string | null
          slug?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_translations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_translations_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_translations_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      article_translators: {
        Row: {
          article_id: string
          created_at: string | null
          display_order: number | null
          individual_id: number
        }
        Insert: {
          article_id: string
          created_at?: string | null
          display_order?: number | null
          individual_id: number
        }
        Update: {
          article_id?: string
          created_at?: string | null
          display_order?: number | null
          individual_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_translators_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_translators_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individual_translations"
            referencedColumns: ["id"]
          },
        ]
      }
      article_view_tracking: {
        Row: {
          article_id: string
          ip_address: string
          viewed_at: string
        }
        Insert: {
          article_id: string
          ip_address: string
          viewed_at?: string
        }
        Update: {
          article_id?: string
          ip_address?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_view_tracking_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_translations"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string | null
          category_id: number | null
          created_at: string | null
          id: string
          image_url: string | null
          individual_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category_id?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          individual_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category_id?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          individual_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      classification_translations: {
        Row: {
          classification_id: number
          created_at: string | null
          id: number
          language: string
          name: string
          updated_at: string | null
        }
        Insert: {
          classification_id: number
          created_at?: string | null
          id?: never
          language: string
          name: string
          updated_at?: string | null
        }
        Update: {
          classification_id?: number
          created_at?: string | null
          id?: never
          language?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classification_translations_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_translations_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      classifications: {
        Row: {
          created_at: string | null
          id: number
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      glossary: {
        Row: {
          created_at: string | null
          definition: string
          id: number
          is_original: boolean
          language: string
          slug: string
          term: string
          translation_group_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          definition: string
          id?: number
          is_original?: boolean
          language?: string
          slug: string
          term: string
          translation_group_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          definition?: string
          id?: number
          is_original?: boolean
          language?: string
          slug?: string
          term?: string
          translation_group_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "glossary_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      image_presets: {
        Row: {
          created_at: string | null
          created_by: string | null
          height: number
          id: string
          name: string
          prompt_template: string
          style_reference_url: string | null
          text_config: Json
          updated_at: string | null
          width: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          height?: number
          id?: string
          name: string
          prompt_template: string
          style_reference_url?: string | null
          text_config?: Json
          updated_at?: string | null
          width?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          height?: number
          id?: string
          name?: string
          prompt_template?: string
          style_reference_url?: string | null
          text_config?: Json
          updated_at?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "image_presets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_project_generations: {
        Row: {
          created_at: string | null
          id: string
          is_selected: boolean | null
          media_id: string
          model: string | null
          project_id: string
          prompt: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_selected?: boolean | null
          media_id: string
          model?: string | null
          project_id: string
          prompt?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_selected?: boolean | null
          media_id?: string
          model?: string | null
          project_id?: string
          prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_project_generations_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_project_generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "image_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      image_projects: {
        Row: {
          aspect_ratio: string | null
          background_image_url: string | null
          created_at: string | null
          created_by: string | null
          enhance_prompt: boolean | null
          generation_prompt: string | null
          height: number
          id: string
          image_size: string | null
          media_id: string | null
          name: string
          person_generation: string | null
          preset_id: string | null
          seed: number | null
          style_reference_url: string | null
          text_config: Json
          text_content: string
          updated_at: string | null
          width: number
        }
        Insert: {
          aspect_ratio?: string | null
          background_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          enhance_prompt?: boolean | null
          generation_prompt?: string | null
          height?: number
          id?: string
          image_size?: string | null
          media_id?: string | null
          name: string
          person_generation?: string | null
          preset_id?: string | null
          seed?: number | null
          style_reference_url?: string | null
          text_config?: Json
          text_content?: string
          updated_at?: string | null
          width?: number
        }
        Update: {
          aspect_ratio?: string | null
          background_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          enhance_prompt?: boolean | null
          generation_prompt?: string | null
          height?: number
          id?: string
          image_size?: string | null
          media_id?: string | null
          name?: string
          person_generation?: string | null
          preset_id?: string | null
          seed?: number | null
          style_reference_url?: string | null
          text_config?: Json
          text_content?: string
          updated_at?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "image_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_projects_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_projects_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "image_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      individual_translations: {
        Row: {
          content: string | null
          content_json: Json | null
          created_at: string | null
          external_links: Json | null
          id: number
          individual_id: string | null
          is_original: boolean
          language: string
          name: string
          original_name: string | null
          ranking: string | null
          slug: string
          status: string
          type_id: number | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_json?: Json | null
          created_at?: string | null
          external_links?: Json | null
          id?: number
          individual_id?: string | null
          is_original?: boolean
          language?: string
          name: string
          original_name?: string | null
          ranking?: string | null
          slug: string
          status?: string
          type_id?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_json?: Json | null
          created_at?: string | null
          external_links?: Json | null
          id?: number
          individual_id?: string | null
          is_original?: boolean
          language?: string
          name?: string
          original_name?: string | null
          ranking?: string | null
          slug?: string
          status?: string
          type_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "individual_translations_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_translations_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "individual_translations_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      individuals: {
        Row: {
          created_at: string | null
          id: string
          original_name: string | null
          ranking: string | null
          type_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_name?: string | null
          ranking?: string | null
          type_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          original_name?: string | null
          ranking?: string | null
          type_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "individuals_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string | null
          direction: string
          is_active: boolean
          name: string
          native_name: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          direction?: string
          is_active?: boolean
          name: string
          native_name: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          direction?: string
          is_active?: boolean
          name?: string
          native_name?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          executed_at: string | null
          id: string
          operation: string
          rows_affected: number | null
        }
        Insert: {
          executed_at?: string | null
          id?: string
          operation: string
          rows_affected?: number | null
        }
        Update: {
          executed_at?: string | null
          id?: string
          operation?: string
          rows_affected?: number | null
        }
        Relationships: []
      }
      media: {
        Row: {
          alt_text: string | null
          audio_album: string | null
          audio_album_artist: string | null
          audio_artist: string | null
          audio_comment: string | null
          audio_composer: string | null
          audio_duration: number | null
          audio_genre: string | null
          audio_title: string | null
          audio_track_number: string | null
          audio_year: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          has_cover_art: boolean | null
          id: string
          media_type: string
          mime_type: string
          original_name: string
          slug: string
          transcription: string | null
          updated_at: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          audio_album?: string | null
          audio_album_artist?: string | null
          audio_artist?: string | null
          audio_comment?: string | null
          audio_composer?: string | null
          audio_duration?: number | null
          audio_genre?: string | null
          audio_title?: string | null
          audio_track_number?: string | null
          audio_year?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          has_cover_art?: boolean | null
          id?: string
          media_type: string
          mime_type: string
          original_name: string
          slug: string
          transcription?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          audio_album?: string | null
          audio_album_artist?: string | null
          audio_artist?: string | null
          audio_comment?: string | null
          audio_composer?: string | null
          audio_duration?: number | null
          audio_genre?: string | null
          audio_title?: string | null
          audio_track_number?: string | null
          audio_year?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          has_cover_art?: boolean | null
          id?: string
          media_type?: string
          mime_type?: string
          original_name?: string
          slug?: string
          transcription?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          category_id: number | null
          content: string
          content_json: Json | null
          created_at: string | null
          id: number
          image_url: string | null
          is_original: boolean
          language: string
          slug: string
          source: string | null
          status: string
          title: string
          translation_group_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category_id?: number | null
          content: string
          content_json?: Json | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          is_original?: boolean
          language?: string
          slug: string
          source?: string | null
          status?: string
          title: string
          translation_group_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category_id?: number | null
          content?: string
          content_json?: Json | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          is_original?: boolean
          language?: string
          slug?: string
          source?: string | null
          status?: string
          title?: string
          translation_group_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role_id: number | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role_id?: number | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role_id?: number | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          order: number | null
          slug: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          label?: string | null
          order?: number | null
          slug: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          label?: string | null
          order?: number | null
          slug?: string
          value?: string | null
        }
        Relationships: []
      }
      tag_translations: {
        Row: {
          created_at: string | null
          id: number
          language: string
          name: string
          tag_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          language: string
          name: string
          tag_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          language?: string
          name?: string
          tag_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tag_translations_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tag_translations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_articles: {
        Row: {
          article_id: string
          created_at: string | null
          custom_event_date_gregorian: string | null
          custom_event_date_hijri: string | null
          custom_title: string | null
          display_order: number | null
          id: string
          parent_id: string | null
          timeline_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          custom_event_date_gregorian?: string | null
          custom_event_date_hijri?: string | null
          custom_title?: string | null
          display_order?: number | null
          id?: string
          parent_id?: string | null
          timeline_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          custom_event_date_gregorian?: string | null
          custom_event_date_hijri?: string | null
          custom_title?: string | null
          display_order?: number | null
          id?: string
          parent_id?: string | null
          timeline_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_articles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "timeline_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_articles_timeline_id_fkey"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "timeline_translations"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_translations: {
        Row: {
          category_id: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_original: boolean
          language: string | null
          slug: string
          status: string | null
          timeline_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_original?: boolean
          language?: string | null
          slug: string
          status?: string | null
          timeline_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_original?: boolean
          language?: string | null
          slug?: string
          status?: string | null
          timeline_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_translations_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "timeline_translations_timeline_id_fkey"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "timelines"
            referencedColumns: ["id"]
          },
        ]
      }
      timelines: {
        Row: {
          author_id: string | null
          category_id: number | null
          created_at: string | null
          id: string
          image_url: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category_id?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category_id?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timelines_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timelines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      type_translations: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          language: string
          name: string
          type_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          language: string
          name: string
          type_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          language?: string
          name?: string
          type_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "type_translations_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "type_translations_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      types: {
        Row: {
          classification_id: number
          created_at: string | null
          description: string | null
          id: number
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          classification_id: number
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          classification_id?: number
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "types_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "classifications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_view_tracking: { Args: never; Returns: undefined }
      increment_article_views: {
        Args: { article_slug: string; viewer_ip: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_author: { Args: never; Returns: boolean }
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
