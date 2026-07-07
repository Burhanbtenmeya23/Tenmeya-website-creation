"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { LandingPageContentSchema } from "@/lib/validations/content.schema";

export type PublishResult = { error?: string; publishedAt?: string };

/**
 * Snapshots the current draft into a new published_pages row (append-only —
 * see ARCHITECTURE.md §3.2) and points landing_pages at it. Re-validates
 * against the full content schema first: drafts can be incomplete, but
 * published content can't.
 */
export async function publishLandingPage(landingPageId: string): Promise<PublishResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: landingPage } = await supabase
    .from("landing_pages")
    .select("id, creator_id, handle")
    .eq("id", landingPageId)
    .single();

  if (!landingPage || landingPage.creator_id !== user.id) {
    return { error: "You don't have access to this landing page." };
  }

  const { data: draft } = await supabase
    .from("drafts")
    .select("content, seo")
    .eq("landing_page_id", landingPageId)
    .single();

  const parsed = LandingPageContentSchema.safeParse(draft?.content ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".");
    return { error: `${path ? `${path}: ` : ""}${issue?.message ?? "Content is incomplete."}` };
  }

  const { data: lastVersion } = await supabase
    .from("published_pages")
    .select("version")
    .eq("landing_page_id", landingPageId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (lastVersion?.version ?? 0) + 1;
  const now = new Date().toISOString();

  const { data: publishedPage, error: insertError } = await supabase
    .from("published_pages")
    .insert({
      landing_page_id: landingPageId,
      content: parsed.data as unknown as never,
      seo: parsed.data.seo as unknown as never,
      version: nextVersion,
      published_by: user.id,
      published_at: now,
    })
    .select("id")
    .single();

  if (insertError || !publishedPage) {
    return { error: insertError?.message ?? "Could not publish." };
  }

  const { error: updateError } = await supabase
    .from("landing_pages")
    .update({ status: "published", current_published_id: publishedPage.id })
    .eq("id", landingPageId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath(`/${landingPage.handle}`);
  return { publishedAt: now };
}

export type UnpublishResult = { error?: string };

export async function unpublishLandingPage(landingPageId: string): Promise<UnpublishResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: landingPage } = await supabase
    .from("landing_pages")
    .select("creator_id, handle")
    .eq("id", landingPageId)
    .single();

  if (!landingPage || landingPage.creator_id !== user.id) {
    return { error: "You don't have access to this landing page." };
  }

  const { error } = await supabase
    .from("landing_pages")
    .update({ status: "unpublished" })
    .eq("id", landingPageId);

  if (error) return { error: error.message };

  revalidatePath(`/${landingPage.handle}`);
  return {};
}
