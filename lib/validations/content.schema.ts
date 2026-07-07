import { z } from "zod";

/**
 * The JSON content shape stored in drafts.content / published_pages.content.
 * See ARCHITECTURE.md §4 for the design rationale — in particular, `pricing`
 * is not its own section: it's a `PricingBlock` embedded in `hero`, and the
 * sticky bottom CTA bar reads from that same object rather than duplicating
 * it (see ARCHITECTURE.md §0.2/§4 on the sticky bar not being a section).
 */

const MediaRef = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
});

const CtaLink = z.object({ label: z.string().min(1), href: z.string().min(1) });

const PricingBlockSchema = z.object({
  currency: z.string().default("USD"),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  discountLabel: z.string().optional(),
  cta: CtaLink,
});

const StatChipSchema = z.object({
  icon: z.string().min(1),
  label: z.string().min(1),
});

const HeroSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  headlineHighlight: z.string().optional(),
  subheadline: z.string().optional(),
  media: MediaRef.optional(),
  countdown: z
    .object({
      enabled: z.boolean().default(false),
      endsAt: z.string().datetime(),
    })
    .optional(),
  stats: z.array(StatChipSchema).default([]),
  pricing: PricingBlockSchema,
});

const BenefitItemSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});
const BenefitsSchema = z.object({
  heading: z.string().optional(),
  items: z.array(BenefitItemSchema).min(1),
});

const CurriculumItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  durationLabel: z.string().optional(),
});
const CurriculumSchema = z.object({
  heading: z.string().optional(),
  items: z.array(CurriculumItemSchema).min(1),
});

const InstructorSchema = z.object({
  heading: z.string().optional(),
  name: z.string().min(1),
  title: z.string().optional(),
  bio: z.string().optional(),
  avatar: MediaRef.optional(),
});

const FreeLessonSchema = z.object({
  heading: z.string().optional(),
  videoUrl: z.string().url(),
  posterImage: MediaRef.optional(),
});

const TestimonialItemSchema = z.object({
  quote: z.string().min(1),
  authorName: z.string().min(1),
  authorTitle: z.string().optional(),
  authorAvatar: MediaRef.optional(),
  rating: z.number().min(1).max(5).optional(),
});
const TestimonialsSchema = z.object({
  heading: z.string().optional(),
  items: z.array(TestimonialItemSchema).min(1),
});

const AudienceItemSchema = z.object({
  icon: z.string().optional(),
  label: z.string().min(1),
});
const AudienceSchema = z.object({
  heading: z.string().optional(),
  items: z.array(AudienceItemSchema).min(1),
});

const FaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});
const FaqSchema = z.object({
  heading: z.string().optional(),
  items: z.array(FaqItemSchema).min(1),
});

const FooterSchema = z.object({
  logo: MediaRef.optional(),
  tagline: z.string().optional(),
  links: z.array(CtaLink).default([]),
  socialLinks: z
    .array(z.object({ platform: z.string().min(1), href: z.string().min(1) }))
    .default([]),
  copyrightText: z.string().optional(),
});

export const SectionSchemas = {
  hero: HeroSchema,
  benefits: BenefitsSchema,
  curriculum: CurriculumSchema,
  instructor: InstructorSchema,
  freeLesson: FreeLessonSchema,
  testimonials: TestimonialsSchema,
  audience: AudienceSchema,
  faq: FaqSchema,
  footer: FooterSchema,
} as const;

export type SectionKey = keyof typeof SectionSchemas;

export const LandingPageContentSchema = z.object({
  meta: z.object({
    templateId: z.string(),
    templateVersion: z.string(),
    direction: z.enum(["rtl", "ltr"]).default("rtl"),
  }),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().url().optional(),
    canonical: z.string().url().optional(),
    noindex: z.boolean().default(false),
  }),
  themeOverrides: z.record(z.string(), z.string()).default({}),
  sections: z.object({
    hero: HeroSchema.nullable().default(null),
    benefits: BenefitsSchema.nullable().default(null),
    curriculum: CurriculumSchema.nullable().default(null),
    instructor: InstructorSchema.nullable().default(null),
    freeLesson: FreeLessonSchema.nullable().default(null),
    testimonials: TestimonialsSchema.nullable().default(null),
    audience: AudienceSchema.nullable().default(null),
    faq: FaqSchema.nullable().default(null),
    footer: FooterSchema.nullable().default(null),
  }),
});

export type LandingPageContent = z.infer<typeof LandingPageContentSchema>;
export type HeroContent = z.infer<typeof HeroSchema>;
export type BenefitsContent = z.infer<typeof BenefitsSchema>;
export type CurriculumContent = z.infer<typeof CurriculumSchema>;
export type InstructorContent = z.infer<typeof InstructorSchema>;
export type FreeLessonContent = z.infer<typeof FreeLessonSchema>;
export type TestimonialsContent = z.infer<typeof TestimonialsSchema>;
export type AudienceContent = z.infer<typeof AudienceSchema>;
export type FaqContent = z.infer<typeof FaqSchema>;
export type FooterContent = z.infer<typeof FooterSchema>;

export function createEmptyContent(
  templateId: string,
  templateVersion: string,
): LandingPageContent {
  return LandingPageContentSchema.parse({
    meta: { templateId, templateVersion },
    seo: {},
    sections: {},
  });
}
