-- Apply after the Phase 9 migration. Additive; no existing policies are replaced.
begin;

create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('bug', 'suggestion', 'content_issue', 'other')),
  title text not null check (length(btrim(title)) between 1 and 120),
  message text not null check (length(btrim(message)) between 10 and 4000),
  page_url text check (length(page_url) <= 2048 and page_url ~ '^https?://[^/?#[:space:]@]+(/[^?#[:space:]]*)?$'),
  email text check (length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  reporter_id uuid references auth.users(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'ignored')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index feedback_recent_idx on public.feedback_submissions(created_at desc, id);
create index feedback_status_recent_idx on public.feedback_submissions(status, created_at desc, id);
create index feedback_reporter_recent_idx on public.feedback_submissions(reporter_id, created_at desc);
create index review_submitted_recent_idx on public.review_history(created_at desc, id) where action = 'submitted';

alter table public.feedback_submissions enable row level security;
revoke all on public.feedback_submissions from public, anon, authenticated;
grant select on public.feedback_submissions to authenticated;
grant update(status) on public.feedback_submissions to authenticated;
create policy "Active admins read private feedback" on public.feedback_submissions for select to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin' and status = 'active'));
create policy "Active admins manage feedback status" on public.feedback_submissions for update to authenticated
using (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin' and status = 'active'))
with check (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin' and status = 'active'));

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

-- A narrow, fixed-payload insertion helper is needed because callers have no
-- table INSERT/SELECT permissions. It never returns private rows or accepts a
-- reporter ID, workflow status, timestamp, or SQL text from the caller.
create function app_private.submit_feedback(p_type text, p_title text, p_message text, p_page_url text default null, p_email text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  minute_limit integer := case when caller is null then 20 else 5 end;
  hour_limit integer := case when caller is null then 100 else 20 end;
begin
  if caller is not null and (not exists (select 1 from auth.users where id = caller)
    or exists (select 1 from public.profiles where id = caller and status <> 'active')) then
    raise exception 'Account unavailable';
  end if;
  if p_type is null or p_type not in ('bug', 'suggestion', 'content_issue', 'other')
    or p_title is null or length(btrim(p_title)) not between 1 and 120
    or p_message is null or length(btrim(p_message)) not between 10 and 4000 then
    raise exception 'Invalid feedback' using errcode = '23514';
  end if;
  -- Serialize this small early-testing intake to enforce limits concurrently.
  -- Anonymous quotas are shared across guests; direct RPC cannot bypass them.
  perform pg_catalog.pg_advisory_xact_lock(11811, 11);
  if (select count(*) from public.feedback_submissions where created_at > now() - interval '1 hour') >= 300
    or (select count(*) from public.feedback_submissions where reporter_id is not distinct from caller and created_at > now() - interval '1 minute') >= minute_limit
    or (select count(*) from public.feedback_submissions where reporter_id is not distinct from caller and created_at > now() - interval '1 hour') >= hour_limit then
    raise exception 'Feedback rate limit reached';
  end if;
  insert into public.feedback_submissions(type, title, message, page_url, email, reporter_id)
  values (p_type, btrim(p_title), btrim(p_message), nullif(btrim(p_page_url), ''), case when caller is null then nullif(btrim(p_email), '') else null end, caller);
end;
$$;
revoke all on function app_private.submit_feedback(text,text,text,text,text) from public;
grant execute on function app_private.submit_feedback(text,text,text,text,text) to anon, authenticated;
create function public.submit_feedback(p_type text, p_title text, p_message text, p_page_url text default null, p_email text default null)
returns void language sql security invoker set search_path = '' as $$
  select app_private.submit_feedback(p_type, p_title, p_message, p_page_url, p_email);
$$;
revoke all on function public.submit_feedback(text,text,text,text,text) from public;
grant execute on function public.submit_feedback(text,text,text,text,text) to anon, authenticated;

create function app_private.feedback_timestamp() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function app_private.feedback_timestamp() from public;
create trigger feedback_updated_at before update on public.feedback_submissions
for each row execute function app_private.feedback_timestamp();

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

-- Use immutable names: replacement uploads a new object, then deletes the old.
-- There is intentionally no avatar UPDATE policy or admin ownership bypass.
create policy "Public reads avatars" on storage.objects for select to anon, authenticated
using (bucket_id = 'avatars');
create policy "Writers upload own avatars" on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and name ~ '^[0-9a-f-]+/[0-9a-f-]+\.(jpg|png|webp)$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('contributor','author','editor','admin') and status = 'active')
);
create policy "Writers delete own avatars" on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('contributor','author','editor','admin') and status = 'active')
);

notify pgrst, 'reload schema';
commit;
