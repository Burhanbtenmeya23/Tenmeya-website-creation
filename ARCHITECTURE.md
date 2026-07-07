# Tenmeya Landing Page Builder — Architecture Design

**Status:** Proposal — Phase 0 (pre-implementation). Nothing in this document has been built yet. This is the design to review and approve before Phase 1 begins.

---

## 0. A note on the reference template

This design was written to recreate `tenmeya.com/business/` with visual parity. I was not able to load that URL from this environment — the sandbox's network egress policy returns a hard `403` at the proxy level for `tenmeya.com` (an organization-level policy denial, not a transient error), and `WebFetch` was blocked the same way. I could not screenshot it, inspect its computed styles, or read its markup.

Everything below — the manifest shape, the DB schema, the JSON content schema, and the component list — is designed to be **correct regardless of the exact visual details**, because none of it hardcodes pixel values. The section list (Hero, Benefits, Pricing, Testimonials, FAQ, CTA, Footer, etc.) comes from your brief. What I *cannot* responsibly do yet is guess exact colors, font stack, spacing scale, or animation timing and call it "pixel-perfect" — that would just be fabrication.

**Before Phase 3 (building the actual Business template), I need one of:**
- Full-page desktop + mobile screenshots of `tenmeya.com/business/`, or
- The exported HTML/CSS, or a Figma/design file, or
- Explicit approval to proceed with a well-crafted "generic modern SaaS business page" look using the design-system tokens below as placeholders, to be swapped once real references are available.

Everything else in this document (architecture, schema, engine) is unaffected by this and is ready for review now.

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

```ts
import { z } from 'zod';

const MediaRef = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
});

const HeroSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  primaryCta: z.object({ label: z.string(), href: z.string() }).optional(),
  secondaryCta: z.object({ label: z.string(), href: z.string() }).optional(),
  media: MediaRef.optional(),
});

const LogosSchema = z.object({
  heading: z.string().optional(),
  items: z.array(MediaRef).min(1),
});

const BenefitItemSchema = z.object({
  icon: z.string(),               // lucide icon name
  title: z.string().min(1),
  description: z.string().optional(),
});
const BenefitsSchema = z.object({
  heading: z.string().optional(),
  items: z.array(BenefitItemSchema).min(1),
});

const VideoSchema = z.object({
  heading: z.string().optional(),
  videoUrl: z.string().url(),
  posterImage: MediaRef.optional(),
});

const PricingPlanSchema = z.object({
  name: z.string().min(1),
  price: z.string(),              // formatted string, not a number — supports "Custom", "$49/mo"
  interval: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  cta: z.object({ label: z.string(), href: z.string() }),
  highlighted: z.boolean().optional(),
});
const PricingSchema = z.object({
  heading: z.string().optional(),
  plans: z.array(PricingPlanSchema).min(1),
});

const TestimonialItemSchema = z.object({
  quote: z.string().min(1),
  authorName: z.string().min(1),
  authorTitle: z.string().optional(),
  authorAvatar: MediaRef.optional(),
});
const TestimonialsSchema = z.object({
  heading: z.string().optional(),
  items: z.array(TestimonialItemSchema).min(1),
});

const FaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});
const FaqSchema = z.object({
  heading: z.string().optional(),
  items: z.array(FaqItemSchema).min(1),
});

const CtaSchema = z.object({
  heading: z.string().min(1),
  subheading: z.string().optional(),
  primaryCta: z.object({ label: z.string(), href: z.string() }),
});

const FooterSchema = z.object({
  logo: MediaRef.optional(),
  tagline: z.string().optional(),
  links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  socialLinks: z.array(z.object({ platform: z.string(), href: z.string() })).default([]),
  copyrightText: z.string().optional(),
});

export const LandingPageContentSchema = z.object({
  meta: z.object({
    templateId: z.string(),
    templateVersion: z.string(),
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
    logos: LogosSchema.nullable().default(null),
    benefits: BenefitsSchema.nullable().default(null),
    video: VideoSchema.nullable().default(null),
    pricing: PricingSchema.nullable().default(null),
    testimonials: TestimonialsSchema.nullable().default(null),
    faq: FaqSchema.nullable().default(null),
    cta: CtaSchema.nullable().default(null),
    footer: FooterSchema.nullable().default(null),
  }),
});

export type LandingPageContent = z.infer<typeof LandingPageContentSchema>;
```

Note: `hero` is technically nullable in the schema for symmetry, but the manifest marks it `required: true` — the **form** enforces that required sections can't be submitted empty; the **renderer's** null-check is just defense in depth. This is what makes "no template-specific logic in the app" true even at the validation layer: the app only enforces "manifest says required → form step can't be skipped," never "Hero specifically must exist."

This schema is a superset covering the sections named across your brief (Hero, Logos/social-proof, Benefits, Video, Pricing, Testimonials, FAQ, CTA, Footer). Once I have the actual reference, the `business` manifest will declare exactly which of these sections it uses, in what order, and which fields are required — the schema above doesn't need to change for that, only `templates/business/manifest.json` does.

---

## 5. Component Hierarchy

```
TemplateRenderer
 └─ ThemeProvider (injects manifest.theme + content.themeOverrides as CSS vars)
     ├─ Hero            (data: HeroContent | null)
     ├─ Logos           (data: LogosContent | null)
     ├─ Benefits        (data: BenefitsContent | null)
     ├─ Video           (data: VideoContent | null)
     ├─ Pricing         (data: PricingContent | null)
     ├─ Testimonials    (data: TestimonialsContent | null)
     ├─ Faq             (data: FaqContent | null)
     ├─ Cta             (data: CtaContent | null)
     └─ Footer          (data: FooterContent | null)
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
│       ├── index.ts                        # exports { Hero, Logos, Benefits, ... }
│       ├── Hero.tsx
│       ├── Logos.tsx
│       ├── Benefits.tsx
│       ├── Video.tsx
│       ├── Pricing.tsx
│       ├── Testimonials.tsx
│       ├── Faq.tsx
│       ├── Cta.tsx
│       └── Footer.tsx
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
- **Repeatable fields**: `useFieldArray` per repeater field (Lessons, Testimonials, FAQ, Benefits, etc.) — `+ Add` pushes a new item with default values from the field's schema, never a fixed count.
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
- **SEO**: `generateMetadata` per published page from `content.seo`, JSON-LD schema stub, sitemap entry per published `landing_pages`, `robots` respecting `seo.noindex`.

---

## 10. What this architecture defers, on purpose

- Multi-template dynamic manifests stored in DB (for a marketplace) — MVP manifests live in code; the `templates` table already has the shape to add a DB-driven manifest later without an app-level rewrite.
- Drag-and-drop section reordering — the manifest's `order` field is already the mechanism; a future admin/creator UI would just write back a new `order` per section.
- AI copywriting/image gen — slots in as an alternate "fill this field" action inside `FieldRenderer`, no schema change needed.
- A/B testing, localization, custom domains — all additive to `settings` + a resolution layer, not architecture changes.

---

## Next steps

1. **You review this document.**
2. Send me screenshots/HTML/Figma for `tenmeya.com/business/` (or tell me to proceed with placeholder design-system values) so Phase 3's `templates/business/*` components can target real colors/fonts/spacing.
3. On approval, I start **Phase 1**: Next.js project scaffold, Supabase project wiring, design system tokens, base layout/auth — no template-specific code yet.

I have not written any application code yet, per the brief. This document and the reference-access blocker are the only things I'm asking you to weigh in on before Phase 1 starts.
