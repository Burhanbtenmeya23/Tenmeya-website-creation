import { z } from "zod";

/**
 * A template's manifest is the single source of truth for section order,
 * which component renders a section, which fields the builder form collects
 * for it, and the template's default theme. See ARCHITECTURE.md §2.1.
 */

const FieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const BaseFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
});

export type FieldDef = z.infer<typeof BaseFieldSchema> & {
  type:
    | "text"
    | "textarea"
    | "richtext"
    | "url"
    | "email"
    | "image"
    | "video"
    | "color"
    | "select"
    | "boolean"
    | "number"
    | "datetime"
    | { type: "repeater"; fields: FieldDef[]; min?: number; max?: number };
  options?: { label: string; value: string }[];
};

export const FieldDefSchema: z.ZodType<FieldDef> = BaseFieldSchema.extend({
  type: z.union([
    z.enum([
      "text",
      "textarea",
      "richtext",
      "url",
      "email",
      "image",
      "video",
      "color",
      "select",
      "boolean",
      "number",
      "datetime",
    ]),
    z.object({
      type: z.literal("repeater"),
      fields: z.lazy(() => z.array(FieldDefSchema)),
      min: z.number().optional(),
      max: z.number().optional(),
    }),
  ]),
  options: z.array(FieldOptionSchema).optional(),
});

export const SectionDefSchema = z.object({
  key: z.string(),
  component: z.string(),
  label: z.string(),
  order: z.number(),
  required: z.boolean().default(false),
  fields: z.array(FieldDefSchema),
});

export type SectionDef = z.infer<typeof SectionDefSchema>;

export const TemplateManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  thumbnailUrl: z.string().optional(),
  direction: z.enum(["rtl", "ltr"]).default("rtl"),
  sections: z.array(SectionDefSchema),
  theme: z.object({
    colors: z.record(z.string(), z.string()),
    fontFamily: z.object({ heading: z.string(), body: z.string() }),
    radius: z.string(),
    spacingScale: z.number(),
  }),
  animations: z.object({
    entrance: z.enum(["fade-up", "fade-in", "none"]),
    staggerMs: z.number(),
  }),
});

export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
