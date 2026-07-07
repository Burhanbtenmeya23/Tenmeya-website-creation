import { TemplateManifestSchema } from "@/lib/template-engine/manifest.schema";
import { TemplateRenderer } from "@/lib/template-engine/renderer";
import type { LandingPageContent } from "@/lib/validations/content.schema";

import { Audience } from "./Audience";
import { Benefits } from "./Benefits";
import { Curriculum } from "./Curriculum";
import { Faq } from "./Faq";
import { Footer } from "./Footer";
import { FreeLesson } from "./FreeLesson";
import { Hero } from "./Hero";
import { Instructor } from "./Instructor";
import manifestJson from "./manifest.json";
import { StickyCtaBar } from "./StickyCtaBar";
import { Testimonials } from "./Testimonials";

export const manifest = TemplateManifestSchema.parse(manifestJson);

const components = {
  Hero,
  Benefits,
  Curriculum,
  Instructor,
  FreeLesson,
  Testimonials,
  Audience,
  Faq,
  Footer,
};

/**
 * The template's single render entry point. Composes the generic
 * TemplateRenderer (manifest-driven sections) with chrome that isn't a
 * manifest section — the sticky mobile CTA bar reads hero.pricing directly
 * (see ARCHITECTURE.md §4) — so the app's rendering routes never need to
 * know this template has a sticky bar at all.
 */
export function Page({ content }: { content: LandingPageContent }) {
  return (
    <>
      <TemplateRenderer manifest={manifest} components={components} content={content} />
      <StickyCtaBar hero={content.sections.hero} />
    </>
  );
}
