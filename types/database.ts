/**
 * Hand-written to match supabase/migrations/0001_init.sql. Once a real
 * Supabase project exists, regenerate with:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 * and reconcile with the JSON-content types in lib/validations/content.schema.ts
 * (the `content`/`seo`/`manifest_version` jsonb columns are typed as `Json`
 * here deliberately — their real shape is Zod-validated at the application
 * boundary, not by Postgres).
 *
 * `Relationships: []` on every table is a placeholder — postgrest-js's
 * GenericTable type requires the field, but we don't use nested
 * foreign-table `.select()` embedding yet, so exact FK metadata isn't
 * needed for the queries in this codebase. A real `gen types` run will
 * fill these in correctly.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = "creator" | "admin";
export type LandingPageStatus = "draft" | "published" | "unpublished";
export type MediaType = "image" | "video" | "document";
export type SettingsScope = "global" | "user" | "landing_page";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: ProfileRole;
          handle: string | null;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: ProfileRole;
          handle?: string | null;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      templates: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          thumbnail_url: string | null;
          manifest_version: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          thumbnail_url?: string | null;
          manifest_version: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["templates"]["Insert"]>;
        Relationships: [];
      };
      landing_pages: {
        Row: {
          id: string;
          creator_id: string;
          template_id: string;
          handle: string;
          name: string;
          status: LandingPageStatus;
          current_published_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          template_id: string;
          handle: string;
          name: string;
          status?: LandingPageStatus;
          current_published_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["landing_pages"]["Insert"]>;
        Relationships: [];
      };
      drafts: {
        Row: {
          landing_page_id: string;
          content: Json;
          seo: Json;
          last_saved_at: string;
          updated_by: string | null;
        };
        Insert: {
          landing_page_id: string;
          content?: Json;
          seo?: Json;
          last_saved_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["drafts"]["Insert"]>;
        Relationships: [];
      };
      published_pages: {
        Row: {
          id: string;
          landing_page_id: string;
          content: Json;
          seo: Json;
          version: number;
          published_by: string | null;
          published_at: string;
        };
        Insert: {
          id?: string;
          landing_page_id: string;
          content: Json;
          seo: Json;
          version: number;
          published_by?: string | null;
          published_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["published_pages"]["Insert"]>;
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          owner_id: string;
          landing_page_id: string | null;
          bucket: string;
          path: string;
          url: string;
          type: MediaType;
          size_bytes: number | null;
          width: number | null;
          height: number | null;
          alt_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          landing_page_id?: string | null;
          bucket?: string;
          path: string;
          url: string;
          type: MediaType;
          size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media"]["Insert"]>;
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          scope: SettingsScope;
          scope_id: string | null;
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scope: SettingsScope;
          scope_id?: string | null;
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
