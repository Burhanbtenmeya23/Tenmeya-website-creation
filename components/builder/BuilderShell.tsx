"use client";

import { useState } from "react";
import { FormProvider, useForm, useWatch, type FieldValues } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { buildFieldDefaults } from "@/lib/form-engine/defaults";
import { SectionForm } from "@/lib/form-engine/SectionForm";
import { useAutosave } from "@/lib/form-engine/use-autosave";
import { TemplateRenderer } from "@/lib/template-engine/renderer";
import { getTemplate } from "@/lib/template-engine/registry";
import type { LandingPageContent } from "@/lib/validations/content.schema";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

export function BuilderShell({
  landingPageId,
  landingPageName,
  templateSlug,
  initialContent,
}: {
  landingPageId: string;
  landingPageName: string;
  templateSlug: string;
  initialContent: LandingPageContent;
}) {
  // Resolved client-side, not passed as a prop: component references from
  // templates/business can't cross the Server -> Client Component boundary
  // (only the plain-data manifest/content can) — see registry.ts's note.
  const template = getTemplate(templateSlug);
  if (!template) {
    throw new Error(`Unknown template: ${templateSlug}`);
  }
  const { manifest, components } = template;

  const form = useForm<FieldValues>({ defaultValues: initialContent });
  const sections = [...manifest.sections].sort((a, b) => a.order - b.order);
  const [activeKey, setActiveKey] = useState(sections[0]?.key ?? "");
  const activeSection = sections.find((section) => section.key === activeKey);

  const status = useAutosave(landingPageId, form.watch);
  const liveContent = useWatch({ control: form.control }) as LandingPageContent;
  const sectionValue = form.watch(`sections.${activeKey}`);
  const isEnabled = sectionValue != null;

  return (
    <FormProvider {...form}>
      <div className="grid h-screen grid-cols-1 lg:grid-cols-[220px_1fr_1fr]">
        <aside className="flex flex-col border-e border-border p-4">
          <p className="mb-4 truncate font-semibold">{landingPageName}</p>
          <nav className="flex flex-col gap-1 overflow-y-auto">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveKey(section.key)}
                className={cn(
                  "rounded-md px-3 py-2 text-start text-sm",
                  activeKey === section.key
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50",
                )}
              >
                {section.label}
              </button>
            ))}
          </nav>
          <p className="mt-auto pt-4 text-xs text-muted-foreground">
            {STATUS_LABEL[status]}
          </p>
        </aside>

        <div className="overflow-y-auto p-6">
          {activeSection ? (
            isEnabled || activeSection.required ? (
              <div className="flex flex-col gap-4">
                {!activeSection.required ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => form.setValue(`sections.${activeKey}`, null, { shouldDirty: true })}
                  >
                    Remove {activeSection.label} section
                  </Button>
                ) : null}
                <SectionForm
                  section={activeSection}
                  sectionKey={activeKey}
                  landingPageId={landingPageId}
                />
              </div>
            ) : (
              <Button
                type="button"
                onClick={() =>
                  form.setValue(
                    `sections.${activeKey}`,
                    buildFieldDefaults(activeSection.fields),
                    { shouldDirty: true },
                  )
                }
              >
                + Add {activeSection.label} section
              </Button>
            )
          ) : null}
        </div>

        <div className="hidden overflow-y-auto bg-muted/30 lg:block">
          <div className="pointer-events-none origin-top scale-[0.85]">
            <TemplateRenderer manifest={manifest} components={components} content={liveContent} />
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
