import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTemplate } from "@/lib/template-engine/registry";
import { createClient } from "@/lib/supabase/server";
import { LandingPageContentSchema } from "@/lib/validations/content.schema";

async function getPublishedPage(handle: string) {
  const supabase = await createClient();

  const { data: landingPage } = await supabase
    .from("landing_pages")
    .select("id, name, handle, status, current_published_id, template_id")
    .eq("handle", handle)
    .eq("status", "published")
    .maybeSingle();

  if (!landingPage || !landingPage.current_published_id) return null;

  const { data: publishedPage } = await supabase
    .from("published_pages")
    .select("content")
    .eq("id", landingPage.current_published_id)
    .single();

  if (!publishedPage) return null;

  const { data: templateRow } = await supabase
    .from("templates")
    .select("slug")
    .eq("id", landingPage.template_id)
    .single();

  const template = templateRow ? getTemplate(templateRow.slug) : undefined;
  if (!template) return null;

  const content = LandingPageContentSchema.parse(publishedPage.content);

  return { landingPage, template, content };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const page = await getPublishedPage(handle);
  if (!page) return {};

  const { seo } = page.content;

  return {
    title: seo.title || page.landingPage.name,
    description: seo.description,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
    robots: seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: seo.ogImage
      ? { images: [{ url: seo.ogImage }], title: seo.title, description: seo.description }
      : undefined,
  };
}

export default async function PublishedLandingPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const page = await getPublishedPage(handle);

  if (!page) notFound();

  const { Page } = page.template;
  return <Page content={page.content} />;
}
