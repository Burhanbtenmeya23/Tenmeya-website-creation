import { getCurrentProfile, requireUser } from "@/lib/auth/dal";
import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type LandingPageRow = Database["public"]["Tables"]["landing_pages"]["Row"];

/** Shared owner-or-admin check used by every server action that mutates a landing page. */
export async function assertLandingPageAccess(
  supabase: SupabaseClient,
  landingPageId: string,
): Promise<{ landingPage: LandingPageRow } | { error: string }> {
  const [user, profile] = await Promise.all([requireUser(), getCurrentProfile()]);

  const { data: landingPage } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", landingPageId)
    .single();

  if (!landingPage || (landingPage.creator_id !== user.id && profile?.role !== "admin")) {
    return { error: "You don't have access to this landing page." };
  }

  return { landingPage };
}
