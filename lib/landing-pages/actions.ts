"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { assertLandingPageAccess } from "./access";

export async function duplicateLandingPage(landingPageId: string) {
  const supabase = await createClient();
  const access = await assertLandingPageAccess(supabase, landingPageId);
  if ("error" in access) return access;
  const { landingPage } = access;

  const { data: draft } = await supabase
    .from("drafts")
    .select("content, seo")
    .eq("landing_page_id", landingPageId)
    .single();

  const newHandle = `${landingPage.handle}-copy-${Math.random().toString(36).slice(2, 7)}`;

  const { data: newPage, error } = await supabase
    .from("landing_pages")
    .insert({
      creator_id: landingPage.creator_id,
      template_id: landingPage.template_id,
      handle: newHandle,
      name: `${landingPage.name} (Copy)`,
    })
    .select("id")
    .single();

  if (error || !newPage) {
    return { error: error?.message ?? "Could not duplicate this landing page." };
  }

  if (draft) {
    await supabase
      .from("drafts")
      .update({ content: draft.content as never, seo: draft.seo as never })
      .eq("landing_page_id", newPage.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/pages");
  return { id: newPage.id as string };
}

export async function deleteLandingPage(landingPageId: string) {
  const supabase = await createClient();
  const access = await assertLandingPageAccess(supabase, landingPageId);
  if ("error" in access) return access;

  const { error } = await supabase.from("landing_pages").delete().eq("id", landingPageId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/admin/pages");
  return {};
}

// Thin void-returning wrappers for plain <form action={...}> usage (React
// requires form actions to return void/Promise<void>).
export async function duplicateLandingPageForm(landingPageId: string) {
  await duplicateLandingPage(landingPageId);
}

export async function deleteLandingPageForm(landingPageId: string) {
  await deleteLandingPage(landingPageId);
}
