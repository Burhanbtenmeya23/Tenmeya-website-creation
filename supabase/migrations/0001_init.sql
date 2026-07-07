-- Tenmeya Landing Page Builder — initial schema
-- See ARCHITECTURE.md §3 for the design rationale.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- profiles  (extends auth.users)
-- ─────────────────────────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'creator' check (role in ('creator', 'admin')),
  handle       text unique,
  full_name    text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- templates  (metadata only — manifest + components live in code)
-- ─────────────────────────────────────────────────────────────
create table templates (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  description       text,
  thumbnail_url     text,
  manifest_version  text not null,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- landing_pages  (the creator's "project"; one row per site)
-- ─────────────────────────────────────────────────────────────
create table landing_pages (
  id                     uuid primary key default gen_random_uuid(),
  creator_id             uuid not null references profiles(id) on delete cascade,
  template_id            uuid not null references templates(id),
  handle                 text unique not null,
  name                   text not null,
  status                 text not null default 'draft'
                           check (status in ('draft', 'published', 'unpublished')),
  current_published_id  uuid,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index landing_pages_creator_id_idx on landing_pages(creator_id);
create index landing_pages_handle_idx on landing_pages(handle);

-- ─────────────────────────────────────────────────────────────
-- drafts  (1:1 working copy per landing page — what the builder edits/autosaves)
-- ─────────────────────────────────────────────────────────────
create table drafts (
  landing_page_id  uuid primary key references landing_pages(id) on delete cascade,
  content          jsonb not null default '{}'::jsonb,
  seo              jsonb not null default '{}'::jsonb,
  last_saved_at    timestamptz not null default now(),
  updated_by       uuid references profiles(id)
);

-- Every landing page gets an empty draft row the moment it's created.
create or replace function create_draft_for_landing_page()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.drafts (landing_page_id) values (new.id);
  return new;
end;
$$;

create trigger on_landing_page_created
  after insert on landing_pages
  for each row execute function create_draft_for_landing_page();

-- ─────────────────────────────────────────────────────────────
-- published_pages  (append-only immutable snapshots; latest = live)
-- ─────────────────────────────────────────────────────────────
create table published_pages (
  id               uuid primary key default gen_random_uuid(),
  landing_page_id  uuid not null references landing_pages(id) on delete cascade,
  content          jsonb not null,
  seo              jsonb not null,
  version          integer not null,
  published_by     uuid references profiles(id),
  published_at     timestamptz not null default now(),
  unique (landing_page_id, version)
);

create index published_pages_landing_page_id_idx on published_pages(landing_page_id);

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
  path             text not null,
  url              text not null,
  type             text not null check (type in ('image', 'video', 'document')),
  size_bytes       bigint,
  width            integer,
  height           integer,
  alt_text         text,
  created_at       timestamptz not null default now()
);

create index media_owner_id_idx on media(owner_id);
create index media_landing_page_id_idx on media(landing_page_id);

-- ─────────────────────────────────────────────────────────────
-- settings  (generic scoped key/value for things that aren't page content)
-- ─────────────────────────────────────────────────────────────
create table settings (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null check (scope in ('global', 'user', 'landing_page')),
  scope_id    uuid,
  key         text not null,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  unique (scope, scope_id, key)
);

-- ─────────────────────────────────────────────────────────────
-- updated_at maintenance
-- ─────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger landing_pages_set_updated_at before update on landing_pages
  for each row execute function set_updated_at();
create trigger settings_set_updated_at before update on settings
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table templates enable row level security;
alter table landing_pages enable row level security;
alter table drafts enable row level security;
alter table published_pages enable row level security;
alter table media enable row level security;
alter table settings enable row level security;

-- profiles
create policy "users can read own profile" on profiles
  for select using (id = auth.uid());
create policy "admins can read all profiles" on profiles
  for select using (is_admin());
create policy "users can update own profile" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- templates (read-only from the app; writes are a service-role/admin concern)
create policy "anyone can read active templates" on templates
  for select using (is_active = true or is_admin());
create policy "admins manage templates" on templates
  for all using (is_admin()) with check (is_admin());

-- landing_pages
create policy "creators manage own landing_pages" on landing_pages
  for all using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "admins manage all landing_pages" on landing_pages
  for all using (is_admin()) with check (is_admin());
create policy "published landing_pages are publicly readable" on landing_pages
  for select using (status = 'published');

-- drafts
create policy "creators manage own drafts" on drafts
  for all using (
    exists (
      select 1 from landing_pages lp
      where lp.id = drafts.landing_page_id and lp.creator_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from landing_pages lp
      where lp.id = drafts.landing_page_id and lp.creator_id = auth.uid()
    )
  );
create policy "admins manage all drafts" on drafts
  for all using (is_admin()) with check (is_admin());

-- published_pages (public read — this is what renders anonymous page views)
create policy "published_pages are publicly readable" on published_pages
  for select using (true);
create policy "creators publish own landing_pages" on published_pages
  for insert with check (
    exists (
      select 1 from landing_pages lp
      where lp.id = published_pages.landing_page_id and lp.creator_id = auth.uid()
    )
  );
create policy "admins manage all published_pages" on published_pages
  for all using (is_admin()) with check (is_admin());

-- media
create policy "owners manage own media" on media
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "admins manage all media" on media
  for all using (is_admin()) with check (is_admin());

-- settings
create policy "users manage own user-scoped settings" on settings
  for all using (scope = 'user' and scope_id = auth.uid())
  with check (scope = 'user' and scope_id = auth.uid());
create policy "creators manage own landing_page-scoped settings" on settings
  for all using (
    scope = 'landing_page' and exists (
      select 1 from landing_pages lp
      where lp.id = settings.scope_id and lp.creator_id = auth.uid()
    )
  ) with check (
    scope = 'landing_page' and exists (
      select 1 from landing_pages lp
      where lp.id = settings.scope_id and lp.creator_id = auth.uid()
    )
  );
create policy "anyone can read global settings" on settings
  for select using (scope = 'global');
create policy "admins manage all settings" on settings
  for all using (is_admin()) with check (is_admin());
