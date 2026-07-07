import type { ComponentType } from "react";

import * as business from "@/templates/business";

import type { TemplateManifest } from "./manifest.schema";
import type { LandingPageContent } from "@/lib/validations/content.schema";

export interface TemplateRegistryEntry {
  manifest: TemplateManifest;
  /** A template's single render entry point — see templates/business/index.tsx. */
  Page: ComponentType<{ content: LandingPageContent }>;
}

export const templateRegistry: Record<string, TemplateRegistryEntry> = {
  business: { manifest: business.manifest, Page: business.Page },
};

export function getTemplate(slug: string): TemplateRegistryEntry | undefined {
  return templateRegistry[slug];
}
