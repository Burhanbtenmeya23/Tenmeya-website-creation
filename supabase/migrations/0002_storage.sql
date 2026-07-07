-- Storage bucket for creator-uploaded media (images/videos/documents).
-- Public read (published pages embed direct URLs), owner-scoped writes.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media bucket is publicly readable"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "authenticated users upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners manage their own media objects"
  on storage.objects for update using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners delete their own media objects"
  on storage.objects for delete using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
