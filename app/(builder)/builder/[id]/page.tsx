import { notFound } from "next/navigation";

import { BuilderShell } from "@/components/builder/BuilderShell";
import { requireUser } from "@/lib/auth/dal";
import { getTemplate } from "@/lib/template-engine/registry";
import { createClient } from "@/lib/supabase/server";
import { LandingPageContentSchema } from "@/lib/validations/content.schema";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: landingPage } = await supabase
    .from("landing_pages")
    .select("id, name, creator_id, template_id")
    .eq("id", id)
    .single();

  if (!landingPage || landingPage.creator_id !== user.id) {
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
    .eq("landing_page_id", id)
    .single();

  const rawContent = draft?.content as Record<string, unknown> | null;
  const hasContent = rawContent && Object.keys(rawContent).length > 0;

  const initialContent = LandingPageContentSchema.parse(
    hasContent
      ? rawContent
      : {
          meta: {
            templateId: template.manifest.id,
            templateVersion: template.manifest.version,
          },
          seo: {},
          sections: {},
        },
  );

  return (
    <BuilderShell
      landingPageId={id}
      landingPageName={landingPage.name}
      templateSlug={templateRow!.slug}
      initialContent={initialContent}
    />
  );
}
