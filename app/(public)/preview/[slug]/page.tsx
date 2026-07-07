import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentUser, getCurrentProfile } from "@/lib/auth/dal";
import { getTemplate } from "@/lib/template-engine/registry";
import { createClient } from "@/lib/supabase/server";
import { LandingPageContentSchema } from "@/lib/validations/content.schema";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Renders the current draft. NOTE: gated to the owning creator or an admin
 * for now, matching the current `drafts` RLS policy (owner/admin only —
 * see supabase/migrations/0001_init.sql). ARCHITECTURE.md §8 describes this
 * URL as "shareable for review before publishing," which implies anonymous
 * access; that needs a deliberate decision (e.g. an unguessable slug +
 * relaxed RLS, or a signed token) before that's safe to ship — not made here.
 */
export default async function PreviewLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);

  if (!user) notFound();

  const supabase = await createClient();
  const { data: landingPage } = await supabase
    .from("landing_pages")
    .select("id, name, handle, creator_id, template_id")
    .eq("handle", slug)
    .maybeSingle();

  if (!landingPage || (landingPage.creator_id !== user.id && profile?.role !== "admin")) {
    notFound();
  }

  const { data: templateRow } = await supabase
    .from("templates")
    .select("slug")
    .eq("id", landingPage.template_id)
    .single();

  const template = templateRow ? getTemplate(templateRow.slug) : undefined;
  if (!template) notFound();

  const { data: draft } = await supabase
    .from("drafts")
    .select("content")
    .eq("landing_page_id", landingPage.id)
    .single();

  const content = LandingPageContentSchema.parse(draft?.content ?? {});
  const { Page } = template;

  return <Page content={content} />;
}
