import type { CSSProperties, ReactNode } from "react";

import type { TemplateManifest } from "./manifest.schema";

function camelToKebab(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Applies a template's theme (manifest.theme, overridden per-page by
 * content.themeOverrides) as CSS custom properties scoped to this subtree,
 * and sets `dir` for RTL/LTR content. Template components read these via
 * `var(--tpl-*)` — deliberately separate from the app shell's own
 * `--color-*` tokens in app/globals.css (ARCHITECTURE.md §0.3 vs §2.1).
 */
export function TemplateThemeProvider({
  theme,
  direction,
  themeOverrides,
  children,
}: {
  theme: TemplateManifest["theme"];
  direction: "rtl" | "ltr";
  themeOverrides?: Record<string, string>;
  children: ReactNode;
}) {
  const colors = { ...theme.colors, ...themeOverrides };

  const style: CSSProperties = {
    ...Object.fromEntries(
      Object.entries(colors).map(([key, value]) => [
        `--tpl-${camelToKebab(key)}`,
        value,
      ]),
    ),
    ["--tpl-radius" as string]: theme.radius,
    ["--tpl-spacing-scale" as string]: String(theme.spacingScale),
    ["--tpl-font-heading" as string]: theme.fontFamily.heading,
    ["--tpl-font-body" as string]: theme.fontFamily.body,
  };

  return (
    <div dir={direction} style={style}>
      {children}
    </div>
  );
}
