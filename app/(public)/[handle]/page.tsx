import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Renders a published landing page. Rendering itself (TemplateRenderer,
 * manifest lookup) is Phase 2 — this route currently only proves the
 * handle → landing_page lookup and RLS work; it's a placeholder, not a
 * template renderer yet.
 */
export default async function PublishedLandingPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: landingPage } = await supabase
    .from("landing_pages")
    .select("id, name, handle, status")
    .eq("handle", handle)
    .eq("status", "published")
    .maybeSingle();

  if (!landingPage) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">{landingPage.name}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This page is published, but the template renderer isn&apos;t built
        yet — that&apos;s Phase 2 of the roadmap.
      </p>
    </div>
  );
}
