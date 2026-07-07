import businessManifestJson from "@/templates/business/manifest.json";
import * as businessComponents from "@/templates/business";

import { TemplateManifestSchema, type TemplateManifest } from "./manifest.schema";
import type { TemplateComponents } from "./renderer";

const businessManifest: TemplateManifest =
  TemplateManifestSchema.parse(businessManifestJson);

export interface TemplateRegistryEntry {
  manifest: TemplateManifest;
  components: TemplateComponents;
}

export const templateRegistry: Record<string, TemplateRegistryEntry> = {
  business: {
    manifest: businessManifest,
    components: businessComponents as unknown as TemplateComponents,
  },
};

export function getTemplate(slug: string): TemplateRegistryEntry | undefined {
  return templateRegistry[slug];
}
