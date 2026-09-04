-- Run this in Supabase SQL Editor (New query) — separate from posts.sql.
-- Creates a public storage bucket called "media" for your uploaded images/videos.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Anyone can view/download files (so they show up on your public blog)
create policy "Public can view media"
  on storage.objects for select
  using (bucket_id = 'media');

-- Only you (logged in) can upload
create policy "Authenticated can upload media"
  on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

-- Only you can update/replace files
create policy "Authenticated can update media"
  on storage.objects for update
  using (bucket_id = 'media' and auth.role() = 'authenticated');

-- Only you can delete files
create policy "Authenticated can delete media"
  on storage.objects for delete
  using (bucket_id = 'media' and auth.role() = 'authenticated');
