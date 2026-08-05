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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      about_content: {
        Row: {
          data: Json
          hero_focal_x: number
          hero_focal_y: number
          hero_image_url: string | null
          hero_mirror_rtl: boolean
          hero_zoom: number
          id: string
          updated_at: string
        }
        Insert: {
          data?: Json
          hero_focal_x?: number
          hero_focal_y?: number
          hero_image_url?: string | null
          hero_mirror_rtl?: boolean
          hero_zoom?: number
          id?: string
          updated_at?: string
        }
        Update: {
          data?: Json
          hero_focal_x?: number
          hero_focal_y?: number
          hero_image_url?: string | null
          hero_mirror_rtl?: boolean
          hero_zoom?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          href: string
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          href?: string
          id?: string
          message?: string
          read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Relationships: []
      }
      career_application_events: {
        Row: {
          actor_id: string | null
          application_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["career_app_status"] | null
          id: string
          note: string
          to_status: Database["public"]["Enums"]["career_app_status"]
        }
        Insert: {
          actor_id?: string | null
          application_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["career_app_status"] | null
          id?: string
          note?: string
          to_status: Database["public"]["Enums"]["career_app_status"]
        }
        Update: {
          actor_id?: string | null
          application_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["career_app_status"] | null
          id?: string
          note?: string
          to_status?: Database["public"]["Enums"]["career_app_status"]
        }
        Relationships: [
          {
            foreignKeyName: "career_application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "career_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      career_applications: {
        Row: {
          city: string
          consent_processing: boolean
          country: string
          cover_letter: string
          created_at: string
          current_company: string
          current_title: string
          earliest_start_date: string | null
          email: string
          expected_salary: number | null
          full_name: string
          highest_education: string
          id: string
          internal_notes: string
          job_id: string | null
          languages: string[]
          linkedin_url: string
          nationality: string
          notice_period_days: number | null
          phone: string
          portfolio_url: string
          ref: string
          resume_url: string
          salary_currency: string
          skills: string[]
          source: string
          status: Database["public"]["Enums"]["career_app_status"]
          university: string
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          city?: string
          consent_processing?: boolean
          country?: string
          cover_letter?: string
          created_at?: string
          current_company?: string
          current_title?: string
          earliest_start_date?: string | null
          email: string
          expected_salary?: number | null
          full_name: string
          highest_education?: string
          id?: string
          internal_notes?: string
          job_id?: string | null
          languages?: string[]
          linkedin_url?: string
          nationality?: string
          notice_period_days?: number | null
          phone?: string
          portfolio_url?: string
          ref?: string
          resume_url?: string
          salary_currency?: string
          skills?: string[]
          source?: string
          status?: Database["public"]["Enums"]["career_app_status"]
          university?: string
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          city?: string
          consent_processing?: boolean
          country?: string
          cover_letter?: string
          created_at?: string
          current_company?: string
          current_title?: string
          earliest_start_date?: string | null
          email?: string
          expected_salary?: number | null
          full_name?: string
          highest_education?: string
          id?: string
          internal_notes?: string
          job_id?: string | null
          languages?: string[]
          linkedin_url?: string
          nationality?: string
          notice_period_days?: number | null
          phone?: string
          portfolio_url?: string
          ref?: string
          resume_url?: string
          salary_currency?: string
          skills?: string[]
          source?: string
          status?: Database["public"]["Enums"]["career_app_status"]
          university?: string
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "career_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "career_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      career_jobs: {
        Row: {
          active: boolean
          apply_email: string
          benefits_ar: string
          benefits_en: string
          created_at: string
          deadline: string | null
          department_ar: string
          department_en: string
          description_ar: string
          description_en: string
          employment_type: Database["public"]["Enums"]["career_employment_type"]
          experience_level: Database["public"]["Enums"]["career_experience_level"]
          id: string
          location_ar: string
          location_en: string
          min_years_experience: number
          nice_to_have_ar: string
          nice_to_have_en: string
          openings: number
          remote_policy: Database["public"]["Enums"]["career_remote_policy"]
          requirements_ar: string
          requirements_en: string
          responsibilities_ar: string
          responsibilities_en: string
          salary_currency: string
          salary_max: number | null
          salary_min: number | null
          skills: string[]
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          apply_email?: string
          benefits_ar?: string
          benefits_en?: string
          created_at?: string
          deadline?: string | null
          department_ar?: string
          department_en?: string
          description_ar?: string
          description_en?: string
          employment_type?: Database["public"]["Enums"]["career_employment_type"]
          experience_level?: Database["public"]["Enums"]["career_experience_level"]
          id?: string
          location_ar?: string
          location_en?: string
          min_years_experience?: number
          nice_to_have_ar?: string
          nice_to_have_en?: string
          openings?: number
          remote_policy?: Database["public"]["Enums"]["career_remote_policy"]
          requirements_ar?: string
          requirements_en?: string
          responsibilities_ar?: string
          responsibilities_en?: string
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[]
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          apply_email?: string
          benefits_ar?: string
          benefits_en?: string
          created_at?: string
          deadline?: string | null
          department_ar?: string
          department_en?: string
          description_ar?: string
          description_en?: string
          employment_type?: Database["public"]["Enums"]["career_employment_type"]
          experience_level?: Database["public"]["Enums"]["career_experience_level"]
          id?: string
          location_ar?: string
          location_en?: string
          min_years_experience?: number
          nice_to_have_ar?: string
          nice_to_have_en?: string
          openings?: number
          remote_policy?: Database["public"]["Enums"]["career_remote_policy"]
          requirements_ar?: string
          requirements_en?: string
          responsibilities_ar?: string
          responsibilities_en?: string
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[]
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_qa: {
        Row: {
          active: boolean
          answer_ar: string
          answer_en: string
          created_at: string
          id: string
          keywords: string
          question_ar: string
          question_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer_ar?: string
          answer_en?: string
          created_at?: string
          id?: string
          keywords?: string
          question_ar?: string
          question_en?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer_ar?: string
          answer_en?: string
          created_at?: string
          id?: string
          keywords?: string
          question_ar?: string
          question_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      homepage_slides: {
        Row: {
          active: boolean
          created_at: string
          cta_ar: string
          cta_en: string
          href: string
          id: string
          image: string
          sort_order: number
          subtitle_ar: string
          subtitle_en: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_ar?: string
          cta_en?: string
          href?: string
          id?: string
          image?: string
          sort_order?: number
          subtitle_ar?: string
          subtitle_en?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_ar?: string
          cta_en?: string
          href?: string
          id?: string
          image?: string
          sort_order?: number
          subtitle_ar?: string
          subtitle_en?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          lead_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          lead_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          category: string
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
          items: Json
          lang: string
          message: string
          phone: string
          priority: string
          product_id: string | null
          product_name: string
          product_slug: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          company?: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          items?: Json
          lang?: string
          message?: string
          phone?: string
          priority?: string
          product_id?: string | null
          product_name?: string
          product_slug?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          company?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          items?: Json
          lang?: string
          message?: string
          phone?: string
          priority?: string
          product_id?: string | null
          product_name?: string
          product_slug?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          active: boolean
          body_ar: string
          body_en: string
          category_ar: string
          category_en: string
          created_at: string
          excerpt_ar: string
          excerpt_en: string
          featured: boolean
          id: string
          image_url: string
          published_at: string
          seo_description_ar: string
          seo_description_en: string
          seo_title_ar: string
          seo_title_en: string
          slug: string
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body_ar?: string
          body_en?: string
          category_ar?: string
          category_en?: string
          created_at?: string
          excerpt_ar?: string
          excerpt_en?: string
          featured?: boolean
          id?: string
          image_url?: string
          published_at?: string
          seo_description_ar?: string
          seo_description_en?: string
          seo_title_ar?: string
          seo_title_en?: string
          slug: string
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body_ar?: string
          body_en?: string
          category_ar?: string
          category_en?: string
          created_at?: string
          excerpt_ar?: string
          excerpt_en?: string
          featured?: boolean
          id?: string
          image_url?: string
          published_at?: string
          seo_description_ar?: string
          seo_description_en?: string
          seo_title_ar?: string
          seo_title_en?: string
          slug?: string
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          canonical_url: string | null
          category_ar: string
          category_en: string
          created_at: string
          currency: string
          description_ar: string
          description_en: string
          featured: boolean
          gallery: string[]
          id: string
          image_url: string
          meta_description_ar: string | null
          meta_description_en: string | null
          meta_keywords: string | null
          meta_title_ar: string | null
          meta_title_en: string | null
          name_ar: string
          name_en: string
          og_image: string | null
          price: number | null
          sku: string
          slug: string
          sort_order: number
          stock_status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          canonical_url?: string | null
          category_ar?: string
          category_en?: string
          created_at?: string
          currency?: string
          description_ar?: string
          description_en?: string
          featured?: boolean
          gallery?: string[]
          id?: string
          image_url?: string
          meta_description_ar?: string | null
          meta_description_en?: string | null
          meta_keywords?: string | null
          meta_title_ar?: string | null
          meta_title_en?: string | null
          name_ar?: string
          name_en?: string
          og_image?: string | null
          price?: number | null
          sku?: string
          slug: string
          sort_order?: number
          stock_status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          canonical_url?: string | null
          category_ar?: string
          category_en?: string
          created_at?: string
          currency?: string
          description_ar?: string
          description_en?: string
          featured?: boolean
          gallery?: string[]
          id?: string
          image_url?: string
          meta_description_ar?: string | null
          meta_description_en?: string | null
          meta_keywords?: string | null
          meta_title_ar?: string | null
          meta_title_en?: string | null
          name_ar?: string
          name_en?: string
          og_image?: string | null
          price?: number | null
          sku?: string
          slug?: string
          sort_order?: number
          stock_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pwa_install_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          platform: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          platform?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          platform?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      seo_bot_findings: {
        Row: {
          applied: boolean
          category: string
          created_at: string
          detail: string | null
          id: string
          page_id: string | null
          run_id: string
          severity: string
          suggestion: Json | null
          title: string
        }
        Insert: {
          applied?: boolean
          category: string
          created_at?: string
          detail?: string | null
          id?: string
          page_id?: string | null
          run_id: string
          severity?: string
          suggestion?: Json | null
          title: string
        }
        Update: {
          applied?: boolean
          category?: string
          created_at?: string
          detail?: string | null
          id?: string
          page_id?: string | null
          run_id?: string
          severity?: string
          suggestion?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_bot_findings_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "seo_bot_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_bot_runs: {
        Row: {
          duration_ms: number | null
          error: string | null
          findings_count: number
          finished_at: string | null
          health_score: number | null
          id: string
          started_at: string
          status: string
          suggestions_count: number
          summary: Json | null
          trigger: string
        }
        Insert: {
          duration_ms?: number | null
          error?: string | null
          findings_count?: number
          finished_at?: string | null
          health_score?: number | null
          id?: string
          started_at?: string
          status?: string
          suggestions_count?: number
          summary?: Json | null
          trigger?: string
        }
        Update: {
          duration_ms?: number | null
          error?: string | null
          findings_count?: number
          finished_at?: string | null
          health_score?: number | null
          id?: string
          started_at?: string
          status?: string
          suggestions_count?: number
          summary?: Json | null
          trigger?: string
        }
        Relationships: []
      }
      seo_bot_settings: {
        Row: {
          ai_model: string
          created_at: string
          daily_enabled: boolean
          id: string
          last_run_at: string | null
          next_run_at: string | null
          schedule_cron: string
          updated_at: string
        }
        Insert: {
          ai_model?: string
          created_at?: string
          daily_enabled?: boolean
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          schedule_cron?: string
          updated_at?: string
        }
        Update: {
          ai_model?: string
          created_at?: string
          daily_enabled?: boolean
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          schedule_cron?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_global: {
        Row: {
          bing_verification: string | null
          created_at: string
          default_description_ar: string
          default_description_en: string
          default_keywords_ar: string
          default_keywords_en: string
          default_title_ar: string
          default_title_en: string
          fb_pixel_id: string | null
          ga4_id: string | null
          google_verification: string | null
          gtm_id: string | null
          hreflang_enabled: boolean
          id: string
          og_image_url: string | null
          semrush_verification: string | null
          site_name_ar: string
          site_name_en: string
          updated_at: string
        }
        Insert: {
          bing_verification?: string | null
          created_at?: string
          default_description_ar?: string
          default_description_en?: string
          default_keywords_ar?: string
          default_keywords_en?: string
          default_title_ar?: string
          default_title_en?: string
          fb_pixel_id?: string | null
          ga4_id?: string | null
          google_verification?: string | null
          gtm_id?: string | null
          hreflang_enabled?: boolean
          id?: string
          og_image_url?: string | null
          semrush_verification?: string | null
          site_name_ar?: string
          site_name_en?: string
          updated_at?: string
        }
        Update: {
          bing_verification?: string | null
          created_at?: string
          default_description_ar?: string
          default_description_en?: string
          default_keywords_ar?: string
          default_keywords_en?: string
          default_title_ar?: string
          default_title_en?: string
          fb_pixel_id?: string | null
          ga4_id?: string | null
          google_verification?: string | null
          gtm_id?: string | null
          hreflang_enabled?: boolean
          id?: string
          og_image_url?: string | null
          semrush_verification?: string | null
          site_name_ar?: string
          site_name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_pages: {
        Row: {
          created_at: string
          description_ar: string
          description_en: string
          id: string
          keywords_ar: string
          keywords_en: string
          noindex: boolean
          og_image_url: string | null
          path: string
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string
          description_en?: string
          id: string
          keywords_ar?: string
          keywords_en?: string
          noindex?: boolean
          og_image_url?: string | null
          path: string
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string
          description_en?: string
          id?: string
          keywords_ar?: string
          keywords_en?: string
          noindex?: boolean
          og_image_url?: string | null
          path?: string
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          created_at: string
          enabled: boolean
          from_email: string
          from_name: string
          host: string
          id: string
          password: string
          port: number
          reply_to: string
          secure: boolean
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          from_email?: string
          from_name?: string
          host?: string
          id?: string
          password?: string
          port?: number
          reply_to?: string
          secure?: boolean
          updated_at?: string
          username?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          from_email?: string
          from_name?: string
          host?: string
          id?: string
          password?: string
          port?: number
          reply_to?: string
          secure?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      support_branches: {
        Row: {
          active: boolean
          address: string
          code: string
          created_at: string
          id: string
          name_ar: string
          name_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string
          code: string
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string
          code?: string
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_categories: {
        Row: {
          active: boolean
          created_at: string
          default_sla_policy_id: string | null
          id: string
          name_ar: string
          name_en: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_sla_policy_id?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          default_sla_policy_id?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_categories_default_sla_policy_id_fkey"
            columns: ["default_sla_policy_id"]
            isOneToOne: false
            referencedRelation: "support_sla_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      support_devices: {
        Row: {
          active: boolean
          branch_id: string | null
          client_id: string | null
          created_at: string
          id: string
          model: string
          name: string
          notes: string
          serial: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          branch_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          model?: string
          name?: string
          notes?: string
          serial: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          branch_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          model?: string
          name?: string
          notes?: string
          serial?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_devices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "support_branches"
            referencedColumns: ["id"]
          },
        ]
      }
      support_invoice_recipients: {
        Row: {
          active: boolean
          created_at: string
          department: string
          email: string
          id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department: string
          email: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string
          email?: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_sla_policies: {
        Row: {
          active: boolean
          business_hours_only: boolean
          created_at: string
          first_response_minutes: number
          id: string
          name_ar: string
          name_en: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolve_minutes: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_hours_only?: boolean
          created_at?: string
          first_response_minutes?: number
          id?: string
          name_ar?: string
          name_en?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolve_minutes?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_hours_only?: boolean
          created_at?: string
          first_response_minutes?: number
          id?: string
          name_ar?: string
          name_en?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolve_minutes?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_assignments: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          created_at: string
          id: string
          note: string
          ticket_id: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          note?: string
          ticket_id: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          note?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_url: string
          id: string
          mime_type: string
          size_bytes: number
          ticket_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string
          file_url: string
          id?: string
          mime_type?: string
          size_bytes?: number
          ticket_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          ticket_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          from_value: string
          id: string
          note: string
          ticket_id: string
          to_value: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          from_value?: string
          id?: string
          note?: string
          ticket_id: string
          to_value?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          from_value?: string
          id?: string
          note?: string
          ticket_id?: string
          to_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          branch: string
          category: string
          client_id: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          device_serial: string
          first_response_at: string | null
          first_response_due_at: string | null
          id: string
          invoice_amount: number | null
          invoice_currency: string
          invoice_issued_at: string | null
          invoice_no: string | null
          invoice_notes: string
          invoice_paid_at: string | null
          invoice_status: string
          lang: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolve_due_at: string | null
          resolved_at: string | null
          sla_policy_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_no: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          branch?: string
          category?: string
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          device_serial?: string
          first_response_at?: string | null
          first_response_due_at?: string | null
          id?: string
          invoice_amount?: number | null
          invoice_currency?: string
          invoice_issued_at?: string | null
          invoice_no?: string | null
          invoice_notes?: string
          invoice_paid_at?: string | null
          invoice_status?: string
          lang?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolve_due_at?: string | null
          resolved_at?: string | null
          sla_policy_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_no?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          branch?: string
          category?: string
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          device_serial?: string
          first_response_at?: string | null
          first_response_due_at?: string | null
          id?: string
          invoice_amount?: number | null
          invoice_currency?: string
          invoice_issued_at?: string | null
          invoice_no?: string | null
          invoice_notes?: string
          invoice_paid_at?: string | null
          invoice_status?: string
          lang?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolve_due_at?: string | null
          resolved_at?: string | null
          sla_policy_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_no?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_sla_policy_id_fkey"
            columns: ["sla_policy_id"]
            isOneToOne: false
            referencedRelation: "support_sla_policies"
            referencedColumns: ["id"]
          },
        ]
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
      can_manage_tickets: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "helpdesk_manager"
        | "technician"
        | "client_user"
      career_app_status:
        | "new"
        | "reviewed"
        | "shortlisted"
        | "interviewed"
        | "offered"
        | "accepted"
        | "rejected"
        | "withdrawn"
      career_employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
      career_experience_level: "intern" | "junior" | "mid" | "senior" | "lead"
      career_remote_policy: "onsite" | "hybrid" | "remote"
      notification_type: "lead" | "slide" | "system"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "new"
        | "open"
        | "in_progress"
        | "waiting_client"
        | "resolved"
        | "closed"
        | "cancelled"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "helpdesk_manager",
        "technician",
        "client_user",
      ],
      career_app_status: [
        "new",
        "reviewed",
        "shortlisted",
        "interviewed",
        "offered",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      career_employment_type: [
        "full_time",
        "part_time",
        "contract",
        "internship",
      ],
      career_experience_level: ["intern", "junior", "mid", "senior", "lead"],
      career_remote_policy: ["onsite", "hybrid", "remote"],
      notification_type: ["lead", "slide", "system"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: [
        "new",
        "open",
        "in_progress",
        "waiting_client",
        "resolved",
        "closed",
        "cancelled",
      ],
    },
  },
} as const
