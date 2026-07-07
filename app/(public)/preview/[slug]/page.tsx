import { notFound } from "next/navigation";

import { getCurrentUser, getCurrentProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Renders a draft preview. NOTE: gated to the owning creator or an admin
 * for now, matching the current `drafts` RLS policy (owner/admin only —
 * see supabase/migrations/0001_init.sql). ARCHITECTURE.md §8 describes this
 * URL as "shareable for review before publishing," which implies anonymous
 * access; that needs a deliberate decision (e.g. an unguessable slug +
 * relaxed RLS, or a signed token) before Phase 4 ships it — not made here.
 */
export default async function PreviewLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [user, profile] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
  ]);

  if (!user) {
    notFound();
  }

  const supabase = await createClient();
  const query = supabase
    .from("landing_pages")
    .select("id, name, handle, creator_id")
    .eq("handle", slug);

  const { data: landingPage } = await query.maybeSingle();

  if (
    !landingPage ||
    (landingPage.creator_id !== user.id && profile?.role !== "admin")
  ) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">{landingPage.name} (preview)</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Draft rendering isn&apos;t built yet — that&apos;s Phase 2 of the
        roadmap.
      </p>
    </div>
  );
}
