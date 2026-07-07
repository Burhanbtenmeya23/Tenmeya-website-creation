"use server";

import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type UploadMediaState = { url?: string; error?: string };

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
];

export async function uploadMedia(
  landingPageId: string,
  formData: FormData,
): Promise<UploadMediaState> {
  const user = await requireUser();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "File is too large (10MB max)." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Unsupported file type." };
  }

  const supabase = await createClient();

  const { data: landingPage } = await supabase
    .from("landing_pages")
    .select("id, creator_id")
    .eq("id", landingPageId)
    .single();

  if (!landingPage || landingPage.creator_id !== user.id) {
    return { error: "You don't have access to this landing page." };
  }

  const extension = file.name.split(".").pop() || "bin";
  const path = `${user.id}/${landingPageId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(path);
  const type = file.type.startsWith("video") ? "video" : "image";

  await supabase.from("media").insert({
    owner_id: user.id,
    landing_page_id: landingPageId,
    path,
    url: publicUrlData.publicUrl,
    type,
    size_bytes: file.size,
  });

  return { url: publicUrlData.publicUrl };
}
