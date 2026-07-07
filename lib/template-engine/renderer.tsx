import type { ComponentType } from "react";

import type { LandingPageContent } from "@/lib/validations/content.schema";

import type { TemplateManifest } from "./manifest.schema";
import { TemplateThemeProvider } from "./theme-provider";
import { isSectionVisible } from "./visibility";

export interface TemplateComponents {
  [componentName: string]: ComponentType<{ data: never }>;
}

/**
 * Walks manifest.sections in order and renders whichever ones have content,
 * via the component the manifest names for each. This is the one render
 * path shared by live preview, /preview/[slug], and the published route —
 * see ARCHITECTURE.md §1.2.
 */
export function TemplateRenderer({
  manifest,
  components,
  content,
}: {
  manifest: TemplateManifest;
  components: TemplateComponents;
  content: LandingPageContent;
}) {
  const sections = [...manifest.sections].sort((a, b) => a.order - b.order);
  const sectionData = content.sections as Record<string, unknown>;

  return (
    <TemplateThemeProvider
      theme={manifest.theme}
      direction={content.meta.direction ?? manifest.direction}
      themeOverrides={content.themeOverrides}
    >
      {sections.map((section) => {
        const data = sectionData[section.key];
        if (!isSectionVisible(data)) return null;

        const Component = components[section.component];
        if (!Component) return null;

        return <Component key={section.key} data={data as never} />;
      })}
    </TemplateThemeProvider>
  );
}
