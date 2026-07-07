# Tenmeya Landing Page Builder — Architecture Design

**Status:** Proposal — Phase 0 (pre-implementation). Nothing in this document has been built yet. This is the design to review and approve before Phase 1 begins.

---

## 0. Reference template analysis

`tenmeya.com/business/` is not reachable from this sandbox (the network egress policy hard-blocks it — a `403` policy denial at the proxy, confirmed not a transient error). The analysis below is instead from screenshots supplied directly: one desktop capture of the hero, and one full-page mobile capture. That's enough to fix the section list, content shape, and a first-pass design-system palette — it is **not** enough for pixel-level accuracy on desktop layouts below the hero (benefits/curriculum/testimonials/audience/FAQ), since I've only seen those stacked in mobile. See the open items at the end of this section.

### 0.1 What the template actually is

This is a **single-offer course/service sales page** (Arabic content, RTL layout), not a multi-tier SaaS pricing page. That reframes one assumption from the first draft of this doc: "Pricing" is not a grid of plan cards — it's one price, shown twice (in the Hero, and almost certainly in a sticky bottom bar on mobile), sourced from one piece of content. This lines up with the form-steps outline in the original brief (Hero → Pricing → Course → Lessons → Testimonials → Instructor → Audience → FAQ) far better than the generic multi-plan `Pricing` section I'd speculatively designed — that section is revised below (§4).

### 0.2 Section inventory, in page order

| # | Section | What's in it |
|---|---|---|
| 1 | **Hero** | Countdown-timer pill (day/hr/min/sec, urgency), framed video thumbnail with play button, headline (with one phrase color-highlighted), gray subheadline, a row of small icon+label stat chips (category, duration, lesson count, rating), and a fused price block: original price (struck through) + current price + discount % + "Subscribe" CTA button |
| 2 | **Benefits** ("ماذا ستحصل عند الإشتراك؟" — What you get) | Icon + title rows, e.g. recorded videos, completion certificate, lifetime access |
| 3 | **Curriculum** ("محاور الدورة" — Course modules) | Numbered, expandable rows (accordion) — one per lesson/module, chevron to reveal detail |
| 4 | **Instructor** ("مقدّم الدورة") | Avatar, name, title, short bio |
| 5 | **Free lesson CTA** ("شاهد درس مجاني") | A single video-preview block used as a mid-page conversion nudge |
| 6 | **Testimonials** | Repeating cards: star rating, quote, reviewer name |
| 7 | **Audience** ("لمن هذه الدورة؟" — Who is this for) | Checklist of target-audience bullet items with icons |
| 8 | **FAQ** ("أسئلة شائعة") | Accordion, question + expandable answer |
| 9 | **Sticky CTA bar** (mobile) | Persistent bottom bar repeating price + Subscribe button — this is chrome/behavior, not separate content; it reads from the same `hero.pricing` data (see §4) |
| — | **Footer** | Not visible in either screenshot — still need a capture of the page bottom |

This replaces the generic `Logos` / multi-plan `Pricing` / `Video` / `Cta` section set from the first draft with template-specific sections: `benefits`, `curriculum`, `instructor`, `freeLesson`, `testimonials`, `audience`, `faq`. The engine architecture (§1–§2) doesn't change at all — this is exactly the kind of change that's supposed to only touch `templates/business/manifest.json` and its components, never the app shell.

### 0.3 Design tokens observed (best-effort visual read — not sampled from real CSS)

These are estimates from looking at the screenshots, not extracted pixel values. Treat every hex code here as a placeholder to be corrected once I can inspect real CSS or get exact values from you:

- **Heading/text-dark**: deep navy, near-black — approx. `#0E1B2C`–`#111827`
- **Body/secondary text**: mid slate gray — approx. `#5B6472`
- **Accent (teal/mint)**: used for the countdown pill background (gradient), the highlighted headline phrase, and the discount text — approx. `#34D8B0` → `#5EEAD4` gradient
- **Price block background**: near-black navy, approx. `#0B1420`, with a white pill CTA button inset
- **Surface**: white/off-white page background
- **Radius**: large on the hero video card (~20–24px) and the price block (~16px); fully pill-shaped on the countdown badge and CTA button
- **Type**: bold geometric Arabic sans for headings, regular weight for body — exact family unknown (candidates: IBM Plex Sans Arabic, Noto Kufi Arabic, or a custom Tenmeya font); numerals render in a bold tabular style in the countdown/stats
- **RTL is a first-class layout requirement**, not an afterthought — the design system and every template component need `dir="rtl"` support from day one, and Tailwind's logical properties (`ps-`, `pe-`, `ms-`, `me-` instead of `pl-`/`pr-`/`ml-`/`mr-`) throughout, not just on the Business template.

### 0.4 Still needed before Phase 3 can claim pixel parity

1. **Desktop screenshots for sections 2–8** (I only have mobile stacked views for these — desktop is very likely multi-column, not a single stack).
2. **A screenshot of the footer** (not visible in either capture).
3. **Exact colors/fonts** if available (a Figma link, exported CSS, or brand guide) — my hex values above are visual estimates, not measurements.
4. Confirmation of the **font family** actually in use.

I can proceed to Phase 1 (project scaffold, no template-specific code) without any of this. I'd want at least items 1–2 before writing `templates/business/*.tsx` in Phase 3.

---

## 1. Product Architecture

### 1.1 The core rule

> Build a **template engine**, not a page generator.

Concretely, this means the Next.js application must never contain a line like `if (template === 'business') render <BusinessHero />`. Instead:

```
Creator picks template
        │
        ▼
Template = { manifest.json, section components }   (lives in /templates/<slug>)
        │
        ▼
Creator fills form  →  Content JSON  (validated against schema derived from manifest)
        │
        ▼
TemplateRenderer(manifest, content)
        │
        ▼
 for each section in manifest.sections (ordered):
     data = content.sections[section.key]
     if (isVisible(data)) render registry[section.component] with { data, theme }
        │
        ▼
   Landing Page (same renderer for live preview, preview URL, and published URL)
```

The application shell (routing, auth, dashboard, form engine, publishing) never knows what a "Hero" or "Pricing" section *is*. It only knows how to walk a manifest and hand data to whatever component the manifest points to. Adding template #2 means adding a new folder under `/templates`, never touching `/app`, `/lib`, or the DB schema.

### 1.2 Why the same renderer serves preview, draft-preview, and published

This is the single most important guarantee in the brief ("the generated landing page should look identical to the selected template"). If the live-preview pane and the published page used different rendering code paths, they would drift over time. So:

- **Live preview** (in the builder): `<TemplateRenderer manifest={m} content={formStateAsJSON} />`, client-side, re-rendered on every keystroke via React state — no network round-trip needed.
- **Preview URL** (`/preview/{slug}`): `<TemplateRenderer manifest={m} content={draftRow.content} />`, server component, reads the `drafts` table.
- **Published URL** (`{handle}.tenmeya.com`): `<TemplateRenderer manifest={m} content={publishedPage.content} />`, server component, reads the latest `published_pages` row.

Three call sites, one renderer, one component tree. No re-implementation, no drift.

### 1.3 Tech stack mapping (from your list)

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js App Router | Server Components for published/preview pages (fast, SEO-friendly, no client JS for static content); Client Components only where interactive (builder form, preview pane) |
| Styling | Tailwind CSS + design tokens | Utility-first, trivially themeable via CSS variables per template |
| Components | shadcn/ui | Unstyled-enough primitives we fully own (no black-box runtime dependency), composable with Tailwind tokens |
| Motion | Framer Motion | Declarative enter/hover animations driven by manifest `animations` config, not hardcoded per component |
| Forms | React Hook Form + Zod | RHF for perf (uncontrolled inputs, minimal re-renders — important since every keystroke also feeds the live preview), Zod for schema validation shared between client and server |
| Data | Supabase (Postgres + Storage + Auth) | Managed Postgres with JSONB for flexible content, built-in RLS for authz, Storage for media, Auth for creators/admins |
| Server state | TanStack Query | Cache + mutate landing pages/drafts/media from client components (dashboard, builder) |
| Icons | Lucide | Matches shadcn ecosystem, tree-shakeable |

### 1.4 High-level system diagram

```
                         ┌─────────────────────────┐
                         │        Supabase          │
                         │ Postgres + Storage + Auth │
                         └───────────┬───────────────┘
                                     │
                      ┌──────────────┼──────────────┐
                      │              │              │
              ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
              │  Dashboard   │ │  Builder    │ │   Admin     │
              │ (list, CRUD) │ │ (form+live  │ │  Panel      │
              │              │ │  preview)   │ │             │
              └───────┬──────┘ └─────┬──────┘ └─────┬──────┘
                      │              │              │
                      └──────────────┼──────────────┘
                                     │  writes JSON content
                                     ▼
                         ┌───────────────────────┐
                         │   Template Engine      │
                         │ registry + renderer +  │
                         │   visibility engine    │
                         └───────────┬────────────┘
                                     │  reads manifest + components
                                     ▼
                         ┌───────────────────────┐
                         │  /templates/business   │
                         │  manifest.json + *.tsx │
                         └───────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
             Live Preview      /preview/[slug]   {handle}.tenmeya.com
             (client render)   (server, draft)   (server, published)
```

---

## 2. Template Engine Design

### 2.1 Manifest schema

Each template ships a `manifest.json` (validated by a Zod schema at build time, `lib/template-engine/manifest.schema.ts`):

```ts
type FieldType =
  | 'text' | 'textarea' | 'richtext' | 'url' | 'email'
  | 'image' | 'video' | 'color' | 'select' | 'boolean' | 'number'
  | { type: 'repeater'; fields: FieldDef[]; min?: number; max?: number };

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[]; // for select
}

interface SectionDef {
  key: string;              // e.g. "hero" — matches content.sections.hero
  component: string;        // e.g. "Hero" — looked up in this template's component registry
  label: string;            // shown in the form step nav, e.g. "Hero Section"
  order: number;            // render + form-step order
  required: boolean;        // required sections can't be hidden even if empty (e.g. Hero)
  fields: FieldDef[];       // drives both Zod validation and the dynamic form step
}

interface TemplateManifest {
  id: string;               // "business"
  name: string;             // "Business"
  version: string;          // semver, bumped on breaking content-schema changes
  description: string;
  thumbnailUrl: string;
  sections: SectionDef[];
  theme: {
    colors: Record<string, string>;      // css variable values, e.g. { primary: '#...', ... }
    fontFamily: { heading: string; body: string };
    radius: string;                       // base border-radius token
    spacingScale: number;                 // base spacing unit multiplier
  };
  animations: {
    entrance: 'fade-up' | 'fade-in' | 'none';
    staggerMs: number;
  };
}
```

The manifest is the **single source of truth** for: section order, which component renders a section, which fields the form collects for that section, and the template's default theme. Nothing about "business" leaks outside `/templates/business/manifest.json` and its sibling components.

### 2.2 Registry

```ts
// lib/template-engine/registry.ts
import businessManifest from '@/templates/business/manifest.json';
import * as businessComponents from '@/templates/business';

export const templateRegistry = {
  business: { manifest: businessManifest, components: businessComponents },
  // future templates added here, nothing else changes
} satisfies Record<string, { manifest: TemplateManifest; components: Record<string, ComponentType<any>> }>;
```

`templates` DB rows reference `templateRegistry` keys by `slug`. The DB never stores component code or logic — only metadata (name, thumbnail, active/inactive) for the template picker UI.

### 2.3 Renderer + Visibility Engine

```tsx
// lib/template-engine/renderer.tsx
export function TemplateRenderer({ manifest, components, content, mode }: {
  manifest: TemplateManifest;
  components: Record<string, ComponentType<any>>;
  content: LandingPageContent;
  mode: 'preview' | 'published';
}) {
  const sections = [...manifest.sections].sort((a, b) => a.order - b.order);
  return (
    <ThemeProvider theme={{ ...manifest.theme, ...content.themeOverrides }}>
      {sections.map((section) => {
        const data = content.sections[section.key];
        if (!isSectionVisible(data)) return null;
        const Component = components[section.component];
        return <Component key={section.key} data={data} />;
      })}
    </ThemeProvider>
  );
}
```

```ts
// lib/template-engine/visibility.ts
export function isSectionVisible(data: unknown): boolean {
  if (data == null) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === 'object') return Object.keys(data).length > 0 && !(data as any)._hidden;
  return Boolean(data);
}
```

Every section component follows the same contract:

```tsx
// templates/business/Testimonials.tsx
export function Testimonials({ data }: { data: TestimonialsContent | null }) {
  if (!data || data.items.length === 0) return null;
  return ( /* ... */ );
}
```

The renderer's `isSectionVisible` check is a defensive first line; each component *also* guards itself (`if (!data) return null`) per your spec, so a section is never rendered with an empty shell even if it's called directly in a test or a future template's renderer skips the registry check.

### 2.4 Why components live inside `/templates/<slug>/` instead of a shared library

Your brief shows `templates/business/Hero.tsx` etc. — components are **template-owned**, not shared implementations behind a single generic `<Hero>`. This is deliberate: template #2 (say, a "Course" template) may need a visually completely different Hero while still accepting a compatible-ish content shape. Sharing primitives (Button, Container, Section wrapper, typography components) happens at the design-system level (`components/ui`, `components/design-system`); sharing full sections would recreate the "one template hardcoded everywhere" problem the brief explicitly warns against. Each template composes shared primitives into its own section components.

---

## 3. Database Schema (Supabase / Postgres)

### 3.1 Entity overview

```
auth.users (Supabase-managed)
   │ 1:1
   ▼
profiles ──────────────< landing_pages >──────────── templates
                             │   │
                    1:1 ─────┘   └───── 1:N ─────> published_pages
                             │
                          1:1 (current draft)
                             ▼
                          drafts
                             
landing_pages / profiles ──< media
settings (scoped: global | user | landing_page)
```

### 3.2 DDL

```sql
-- ─────────────────────────────────────────────────────────────
-- profiles  (extends auth.users)
-- ─────────────────────────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'creator' check (role in ('creator', 'admin')),
  handle       text unique,                 -- reserved for future creator profile pages
  full_name    text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- templates  (metadata only — manifest + components live in code)
-- ─────────────────────────────────────────────────────────────
create table templates (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,        -- matches templateRegistry key, e.g. 'business'
  name          text not null,
  description   text,
  thumbnail_url text,
  manifest_version text not null,            -- mirrors manifest.json "version", for compat checks
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- landing_pages  (the creator's "project"; one row per site)
-- ─────────────────────────────────────────────────────────────
create table landing_pages (
  id                uuid primary key default gen_random_uuid(),
  creator_id        uuid not null references profiles(id) on delete cascade,
  template_id       uuid not null references templates(id),
  handle            text unique not null,     -- subdomain + path slug, e.g. "acme-coaching"
  name              text not null,            -- internal name shown in dashboard, not public
  status            text not null default 'draft'
                       check (status in ('draft', 'published', 'unpublished')),
  current_published_id uuid references published_pages(id),  -- see note below (nullable FK, added after published_pages exists)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- drafts  (1:1 working copy per landing page — what the builder edits/autosaves)
-- ─────────────────────────────────────────────────────────────
create table drafts (
  landing_page_id  uuid primary key references landing_pages(id) on delete cascade,
  content          jsonb not null default '{}'::jsonb,   -- LandingPageContent, see §4
  seo              jsonb not null default '{}'::jsonb,
  last_saved_at    timestamptz not null default now(),
  updated_by       uuid references profiles(id)
);

-- ─────────────────────────────────────────────────────────────
-- published_pages  (append-only immutable snapshots; latest = live)
-- ─────────────────────────────────────────────────────────────
create table published_pages (
  id               uuid primary key default gen_random_uuid(),
  landing_page_id  uuid not null references landing_pages(id) on delete cascade,
  content          jsonb not null,
  seo              jsonb not null,
  version          integer not null,          -- monotonically increasing per landing_page_id
  published_by     uuid references profiles(id),
  published_at     timestamptz not null default now(),
  unique (landing_page_id, version)
);

alter table landing_pages
  add constraint fk_current_published
  foreign key (current_published_id) references published_pages(id);

-- ─────────────────────────────────────────────────────────────
-- media
-- ─────────────────────────────────────────────────────────────
create table media (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references profiles(id) on delete cascade,
  landing_page_id  uuid references landing_pages(id) on delete set null,
  bucket           text not null default 'media',
  path             text not null,             -- storage object path
  url              text not null,             -- public/signed URL cached at upload time
  type             text not null check (type in ('image', 'video', 'document')),
  size_bytes       bigint,
  width            integer,
  height           integer,
  alt_text         text,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- settings  (generic scoped key/value for things that aren't page content)
-- ─────────────────────────────────────────────────────────────
create table settings (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null check (scope in ('global', 'user', 'landing_page')),
  scope_id    uuid,                            -- null for 'global'
  key         text not null,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  unique (scope, scope_id, key)
);
```

### 3.3 Row-Level Security (sketch)

```sql
alter table landing_pages enable row level security;
alter table drafts enable row level security;
alter table published_pages enable row level security;
alter table media enable row level security;

-- creators manage only their own rows
create policy "creators manage own landing_pages"
  on landing_pages for all
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

create policy "creators manage own drafts"
  on drafts for all
  using (exists (select 1 from landing_pages lp where lp.id = landing_page_id and lp.creator_id = auth.uid()));

-- published content is publicly readable (needed for SSR of public pages via anon key)
create policy "published pages are public"
  on published_pages for select
  using (true);

-- admins bypass via role check
create policy "admins manage everything"
  on landing_pages for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
```

(Full policy set — including `media` and `settings` — gets written out during Phase 1 implementation; this establishes the pattern: creator-scoped by `creator_id`/join, admin bypass by role, public-read only for the one table that needs to be rendered anonymously.)

### 3.4 Why JSONB instead of fully normalized section tables

Storing `content` as JSONB on `drafts`/`published_pages` — rather than a `sections` table with rows per Hero/Pricing/etc. — is deliberate:

- The brief requires "never store generated HTML" and "store everything as JSON," which this satisfies directly.
- Section shapes evolve per template and per manifest version; a normalized schema would need a migration every time a template gains a field, defeating "no template-specific logic in the app."
- The content schema (§4) is still strongly typed and Zod-validated at every write — JSONB doesn't mean unvalidated. Postgres JSONB also supports indexing (`GIN`) if we later need to query into content (e.g., admin search by SEO title).
- Relational tables are still used everywhere a genuine relationship/query need exists: ownership (`creator_id`), publishing history (`published_pages` rows), and media (needs joins for storage cleanup, usage tracking).

---

## 4. JSON Content Schema

This is what actually lives in `drafts.content` / `published_pages.content`. Defined as Zod schemas (`lib/validations/content.schema.ts`) so the same schema validates on the server (API routes), drives type inference for components, and can generate default/empty values for new drafts.

Revised from the first draft to match the actual sections found in §0.2 — a single-offer course/service sales page, not a multi-plan SaaS pricing page. `pricing` is no longer its own scrollable section; it's a `PricingBlock` embedded in `hero` (and the same object also drives the sticky bottom bar) so there is exactly one source of truth for price/discount/CTA, never two copies that could drift.

```ts
import { z } from 'zod';

const MediaRef = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
});

const CtaLink = z.object({ label: z.string(), href: z.string() });

// Single source of truth for price — read by Hero AND the sticky bottom bar.
const PricingBlockSchema = z.object({
  currency: z.string().default('USD'),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),   // struck-through if present
  discountLabel: z.string().optional(),                 // e.g. "Save 33%" — free text, not computed,
                                                          // so a creator can phrase it however they want
  cta: CtaLink,
});

const StatChipSchema = z.object({
  icon: z.string(),          // lucide icon name
  label: z.string().min(1),  // e.g. "Entrepreneurship", "50 min", "15 lessons", "4.4 rating"
});

const HeroSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  headlineHighlight: z.string().optional(),   // substring rendered in the accent color, e.g. "60 minutes"
  subheadline: z.string().optional(),
  media: MediaRef.optional(),                 // hero video/image thumbnail
  countdown: z.object({
    enabled: z.boolean().default(false),
    endsAt: z.string().datetime(),            // renderer computes live day/hr/min/sec from this
  }).optional(),
  stats: z.array(StatChipSchema).default([]), // unlimited, repeatable — not fixed to the 4 shown in the screenshot
  pricing: PricingBlockSchema,                // required: Hero always needs a price+CTA to make sense
});

const BenefitItemSchema = z.object({
  icon: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
});
const BenefitsSchema = z.object({
  heading: z.string().optional(),
  items: z.array(BenefitItemSchema).min(1),
});

const CurriculumItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),   // revealed when the accordion row expands
  durationLabel: z.string().optional(), // e.g. "12 min", shown inline if present
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
  icon: z.string().optional(),   // defaults to a checkmark in the component if omitted
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
  socialLinks: z.array(z.object({ platform: z.string(), href: z.string() })).default([]),
  copyrightText: z.string().optional(),
});

export const LandingPageContentSchema = z.object({
  meta: z.object({
    templateId: z.string(),
    templateVersion: z.string(),
    direction: z.enum(['rtl', 'ltr']).default('rtl'),
  }),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().url().optional(),
    canonical: z.string().url().optional(),
    noindex: z.boolean().default(false),
  }),
  themeOverrides: z.record(z.string()).default({}),   // optional per-page color overrides on top of manifest.theme
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
```

Note: `hero` is technically nullable in the schema for symmetry, but the manifest marks it `required: true` — the **form** enforces that required sections can't be submitted empty; the **renderer's** null-check is just defense in depth. This is what makes "no template-specific logic in the app" true even at the validation layer: the app only enforces "manifest says required → form step can't be skipped," never "Hero specifically must exist."

**The sticky bottom CTA bar is not a content section.** It's a layout behavior the `business` template's root component adds (e.g. rendered once, outside the mapped section list, reading `content.sections.hero.pricing` directly) — visible only when the Hero has scrolled out of view. It has no entry in `manifest.sections` because there's nothing for the form to collect that Hero doesn't already own; encoding it as a fake "section" would create two places a creator could set conflicting prices.

This schema set is specific to what the Business template's course/offer-sales-page shape actually needs (§0.2), not a generic superset — a future template with a different structure (e.g. a multi-tier SaaS pricing page) would define its own section schemas the same way, without touching this file's existing exports or the engine.

---

## 5. Component Hierarchy

```
TemplateRenderer
 └─ ThemeProvider (injects manifest.theme + content.themeOverrides as CSS vars, sets dir="rtl")
     ├─ Hero            (data: HeroContent | null)        — includes countdown, stats, PricingBlock
     ├─ Benefits        (data: BenefitsContent | null)
     ├─ Curriculum      (data: CurriculumContent | null)  — accordion, client island for expand state
     ├─ Instructor      (data: InstructorContent | null)
     ├─ FreeLesson      (data: FreeLessonContent | null)
     ├─ Testimonials    (data: TestimonialsContent | null)
     ├─ Audience        (data: AudienceContent | null)
     ├─ Faq             (data: FaqContent | null)          — accordion, client island for expand state
     └─ Footer          (data: FooterContent | null)

 StickyCtaBar (rendered by templates/business/index.ts's root layout, not by the section map;
               reads content.sections.hero.pricing directly; visible once Hero scrolls out of view)
```

Every section component:
1. Accepts exactly one prop, `data`, typed to its Zod-inferred content shape.
2. `if (!data) return null;` (and for array-backed sections, also treats `items.length === 0` as absent).
3. Is a Server Component by default (no `'use client'`) unless it needs interactivity (e.g., FAQ accordion open/close state, testimonial carousel) — those get a small client "island" wrapping only the interactive part, not the whole section.
4. Is built from shared primitives in `components/ui` (Button, Card, Accordion, Carousel) and `components/design-system` (Container, Section, Heading, Eyebrow) — never raw untyped `<div>` soup duplicated per template.
5. Uses Framer Motion entrance animation driven by `manifest.animations`, not a hardcoded transition per component.

**Builder-side component tree** (the form + live preview app, separate from the rendered output above):

```
BuilderPage
 ├─ BuilderStepNav          (derived from manifest.sections, one step per section + Basic Info/SEO/Publish)
 ├─ FormPanel
 │   └─ StepForm (per current step)
 │       └─ FieldRenderer   (registry: TextField, TextareaField, RichTextField,
 │                            ImageUploadField, ColorField, SelectField, RepeaterField)
 │           └─ RepeaterField renders N × the same field group (Add/Remove) — this is how
 │             Lessons/Testimonials/FAQ/Benefits arrays are edited without fixed-count UI
 └─ PreviewPanel
     └─ TemplateRenderer(manifest, liveFormStateAsContent)   ← same renderer as production
```

`FieldRenderer` is generic and manifest-driven: it reads a section's `fields: FieldDef[]` and renders the matching field component, so adding a new field to `business`'s Pricing section (e.g., a "badge" text field per plan) requires editing `manifest.json` and the Zod schema — never the form engine.

---

## 6. Folder Structure

```
/
├── app/
│   ├── (public)/
│   │   ├── [handle]/page.tsx              # published page, path-based fallback for MVP
│   │   └── preview/[slug]/page.tsx         # read-only render of a draft
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx              # creator's landing pages list
│   │   └── builder/[id]/page.tsx           # split-screen form + live preview
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx
│   │       └── pages/[id]/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── api/
│   │   ├── landing-pages/[id]/autosave/route.ts
│   │   ├── landing-pages/[id]/publish/route.ts
│   │   └── media/upload/route.ts
│   ├── layout.tsx
│   └── globals.css
│
├── templates/
│   └── business/
│       ├── manifest.json
│       ├── index.ts                        # exports { Hero, Benefits, Curriculum, ... }
│       ├── Hero.tsx                        # includes countdown timer + stat chips + PricingBlock
│       ├── Benefits.tsx
│       ├── Curriculum.tsx                  # accordion
│       ├── Instructor.tsx
│       ├── FreeLesson.tsx
│       ├── Testimonials.tsx
│       ├── Audience.tsx
│       ├── Faq.tsx                         # accordion
│       ├── Footer.tsx
│       └── StickyCtaBar.tsx                # mobile persistent bar, reads hero.pricing
│
├── lib/
│   ├── template-engine/
│   │   ├── manifest.schema.ts
│   │   ├── registry.ts
│   │   ├── renderer.tsx
│   │   ├── visibility.ts
│   │   └── theme-provider.tsx
│   ├── form-engine/
│   │   ├── field-registry.tsx
│   │   ├── fields/ (TextField.tsx, ImageUploadField.tsx, RepeaterField.tsx, ...)
│   │   ├── build-zod-schema.ts             # FieldDef[] → z.object at runtime
│   │   └── use-autosave.ts
│   ├── supabase/
│   │   ├── client.ts                       # browser client
│   │   ├── server.ts                       # server component / route handler client
│   │   └── queries/ (landing-pages.ts, drafts.ts, media.ts, ...)
│   └── validations/
│       └── content.schema.ts
│
├── components/
│   ├── ui/                                 # shadcn primitives
│   ├── design-system/
│   │   ├── tokens.ts                       # colors, spacing, radius, typography scale
│   │   ├── Container.tsx
│   │   ├── Section.tsx
│   │   └── Heading.tsx
│   ├── builder/                            # BuilderStepNav, FormPanel, PreviewPanel
│   └── dashboard/
│
├── types/
│   ├── manifest.ts
│   └── database.ts                          # generated via `supabase gen types`
│
├── supabase/
│   └── migrations/
│       └── 0001_init.sql                    # the DDL from §3.2
│
├── middleware.ts                            # subdomain → handle resolution, auth guards
├── tailwind.config.ts
└── next.config.ts
```

---

## 7. Form Engine & Live Preview

- **Multi-step**, steps generated from `manifest.sections` (in `order`) plus fixed non-content steps: Basic Info (handle, template pick — done before this), SEO, Publish.
- **State**: a single React Hook Form instance per landing page, schema = `LandingPageContentSchema` (built once from the manifest via `build-zod-schema.ts` merged with the static schema). One form, many steps — this is what makes "no Generate button, instant preview" trivial: the `PreviewPanel` just watches the same form state (`useWatch`) and feeds it straight into `TemplateRenderer`.
- **Repeatable fields**: `useFieldArray` per repeater field (Curriculum items, Testimonials, FAQ, Benefits, Audience, Stats, etc.) — `+ Add` pushes a new item with default values from the field's schema, never a fixed count.
- **Autosave**: debounced (~800ms after last change) `PATCH /api/landing-pages/[id]/autosave` writing to `drafts.content`; optimistic local state so typing never feels blocked; `drafts.last_saved_at` drives the "Saved 3s ago" indicator; resuming a draft = hydrating the same form from `drafts.content`.
- **Publish**: validates the full form against the manifest's required sections, inserts a new `published_pages` row (`version = max(version)+1`), updates `landing_pages.current_published_id` and `status`. Immutable snapshots mean "Unpublish" just clears `current_published_id`/flips status without deleting history, and a future "rollback to previous version" is a read of an older `published_pages` row — free, given the schema.

---

## 8. URL Strategy

- Draft editing: `/builder/{landingPageId}` (auth-gated, owner or admin only)
- Preview: `/preview/{handle}` — renders current `drafts.content`, should be non-indexable (`noindex`), shareable for review before publishing
- Published: `{handle}.tenmeya.com` via `middleware.ts` rewriting based on the `Host` header to an internal `/_sites/[handle]` route; a plain path fallback `tenmeya.com/sites/{handle}` also works for local dev / no-wildcard-DNS environments
- Custom domains (future): `settings` table (`scope: 'landing_page'`, `key: 'custom_domain'`) + domain verification flow + Vercel Domains API — the rendering path doesn't change at all, only how `middleware.ts` resolves a hostname to a `handle`

---

## 9. Cross-cutting concerns (brief acknowledgement — detailed in later phases)

- **Security**: Zod validation at every write boundary (API routes), Supabase RLS as the real authorization backstop (never trust client-side checks alone), file-type/size validation on upload before it reaches Storage, rate limiting on autosave/publish routes, CSRF via Next's built-in same-origin fetch handling + SameSite cookies for auth.
- **Performance**: Server Components for all public-facing render paths, `next/image` for every `MediaRef`, route-level code splitting (builder's form/preview code never ships to the published-page bundle), ISR or on-demand revalidation for published pages so publishing invalidates cache immediately.
- **Accessibility**: semantic landmarks (`<header>`, `<main>`, `<footer>`, heading hierarchy driven by section order not arbitrary `<h1>`-per-section), visible focus states from the design system, all interactive builder controls keyboard-operable, form fields properly labelled (RHF + shadcn `Label` pairing).
- **RTL**: `dir="rtl"` set at the document/theme level for Arabic content (default for the Business template per §0.3), Tailwind logical spacing (`ps-`/`pe-`/`ms-`/`me-`) used throughout the design system and every template component instead of physical `pl-`/`pr-`, so a future LTR template or bilingual creator content doesn't require component rewrites — only a `dir` flip driven by `content.meta.direction` (or detected from `seo.locale`).
- **SEO**: `generateMetadata` per published page from `content.seo`, JSON-LD schema stub, sitemap entry per published `landing_pages`, `robots` respecting `seo.noindex`.

---

## 10. What this architecture defers, on purpose

- Multi-template dynamic manifests stored in DB (for a marketplace) — MVP manifests live in code; the `templates` table already has the shape to add a DB-driven manifest later without an app-level rewrite.
- Drag-and-drop section reordering — the manifest's `order` field is already the mechanism; a future admin/creator UI would just write back a new `order` per section.
- AI copywriting/image gen — slots in as an alternate "fill this field" action inside `FieldRenderer`, no schema change needed.
- A/B testing, localization, custom domains — all additive to `settings` + a resolution layer, not architecture changes.

---

## Next steps

1. **You review this document**, now updated with the real section inventory (§0.2) and revised schema (§4) from your screenshots.
2. If you have them: desktop screenshots for the sections below the Hero, a footer screenshot, and exact colors/fonts (§0.4) — these sharpen Phase 3, but don't block Phase 1.
3. On approval, I start **Phase 1**: Next.js project scaffold, Supabase project wiring, design system tokens (using §0.3's estimated palette as the starting point), base layout/auth — no template-specific code yet.

I have not written any application code yet, per the brief. This document is the only thing I'm asking you to weigh in on before Phase 1 starts.
