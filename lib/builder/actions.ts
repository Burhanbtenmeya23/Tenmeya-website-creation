"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/dal";
import { assertLandingPageAccess } from "@/lib/landing-pages/access";
import { createClient } from "@/lib/supabase/server";
import type { LandingPageContent } from "@/lib/validations/content.schema";

const CreateLandingPageSchema = z.object({
  name: z.string().min(2, "Enter a name for your landing page."),
  handle: z
    .string()
    .min(3, "Handle must be at least 3 characters.")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
});

export type CreateLandingPageState = { error?: string } | undefined;

export async function createLandingPage(
  _prevState: CreateLandingPageState,
  formData: FormData,
): Promise<CreateLandingPageState> {
  const user = await requireUser();
  const parsed = CreateLandingPageSchema.safeParse({
    name: formData.get("name"),
    handle: formData.get("handle"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: template } = await supabase
    .from("templates")
    .select("id")
    .eq("slug", "business")
    .single();

  if (!template) {
    return { error: "The business template isn't set up yet." };
  }

  const { data: landingPage, error } = await supabase
    .from("landing_pages")
    .insert({
      creator_id: user.id,
      template_id: template.id,
      handle: parsed.data.handle,
      name: parsed.data.name,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "That handle is already taken." };
    }
    return { error: error.message };
  }

  redirect(`/builder/${landingPage.id}`);
}

export type SaveDraftResult = { savedAt?: string; error?: string };

export async function saveDraft(
  landingPageId: string,
  content: LandingPageContent,
): Promise<SaveDraftResult> {
  const supabase = await createClient();
  const access = await assertLandingPageAccess(supabase, landingPageId);
  if ("error" in access) return access;

  const user = await requireUser();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("drafts")
    .update({
      content: content as unknown as never,
      last_saved_at: now,
      updated_by: user.id,
    })
    .eq("landing_page_id", landingPageId);

  if (error) return { error: error.message };
  return { savedAt: now };
}
