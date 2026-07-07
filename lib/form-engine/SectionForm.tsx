"use client";

import type { FieldDef, SectionDef } from "@/lib/template-engine/manifest.schema";

import { FieldRenderer } from "./field-registry";
import { RepeaterField } from "./RepeaterField";

function isRepeaterField(
  field: FieldDef,
): field is FieldDef & {
  type: { type: "repeater"; fields: FieldDef[]; min?: number; max?: number };
} {
  return typeof field.type === "object" && field.type.type === "repeater";
}

/**
 * Renders every field a manifest section declares, bound to
 * `sections.<sectionKey>.<field.key>` in the single page-wide form — field
 * keys in the manifest are section-relative, not full react-hook-form
 * paths, so this is the one place that turns one into the other.
 */
export function SectionForm({
  section,
  sectionKey,
  landingPageId,
}: {
  section: SectionDef;
  sectionKey: string;
  landingPageId: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {section.fields.map((field) => {
        const name = `sections.${sectionKey}.${field.key}`;
        return isRepeaterField(field) ? (
          <RepeaterField
            key={field.key}
            field={field}
            name={name}
            landingPageId={landingPageId}
          />
        ) : (
          <FieldRenderer
            key={field.key}
            field={field}
            name={name}
            landingPageId={landingPageId}
          />
        );
      })}
    </div>
  );
}
