-- Seeds the one MVP template's metadata row. The manifest and components
-- themselves live in code (templates/business/), not here — see
-- ARCHITECTURE.md §2.2. This row exists so the template picker and
-- landing_pages.template_id foreign key have something to reference.

insert into templates (slug, name, description, manifest_version, is_active)
values (
  'business',
  'Business',
  'Single-offer course/service sales page — countdown-driven hero, curriculum, testimonials, FAQ.',
  '0.1.0',
  true
)
on conflict (slug) do nothing;
