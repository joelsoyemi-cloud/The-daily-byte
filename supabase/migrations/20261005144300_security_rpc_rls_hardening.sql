-- Production security hardening: narrow RPC exposure and RLS role scope.
-- Applied to project qusbttnxaivfnbwxhqaj on 2026-10-05.

-- Restrict privileged scheduled publishing to the trusted server client only.
revoke all on function public.publish_due_scheduled_posts() from public, anon, authenticated;
grant execute on function public.publish_due_scheduled_posts() to service_role;

-- Pin trigger-function lookup paths.
alter function public.set_updated_at() set search_path = pg_catalog;
alter function public.sync_post_status_published() set search_path = pg_catalog;

-- Restrict authenticated/editorial policies to signed-in users only.
alter policy "Admins can update any profile" on public.profiles to authenticated;
alter policy "Users can update their own profile" on public.profiles to authenticated;

alter policy "Editors and admins manage categories" on public.categories to authenticated;

alter policy "Authors can read their own posts" on public.posts to authenticated;
alter policy "Editors and admins can read all posts" on public.posts to authenticated;
alter policy "Contributors can create their own drafts" on public.posts to authenticated;
alter policy "Authors can edit their own editable posts" on public.posts to authenticated;
alter policy "Editors and admins can update any post" on public.posts to authenticated;
alter policy "Authors can delete their own drafts" on public.posts to authenticated;
alter policy "Editors and admins can delete any post" on public.posts to authenticated;

alter policy "Authors can read their own review history" on public.review_history to authenticated;
alter policy "Editors and admins can read all review history" on public.review_history to authenticated;
alter policy "Editors and admins can log review actions" on public.review_history to authenticated;
alter policy "Authors can log their own submission" on public.review_history to authenticated;

alter policy "Contributors can upload media" on storage.objects to authenticated;
alter policy "Users can update their own media" on storage.objects to authenticated;
alter policy "Users can delete their own media, editors delete any" on storage.objects to authenticated;

-- Redundant with the broader public publication predicate.
drop policy if exists "Public reads due scheduled stories" on public.posts;

-- Trigger functions never need direct RPC access.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prevent_role_self_escalation() from public, anon, authenticated;
revoke all on function public.enforce_editorial_fields() from public, anon, authenticated;

-- RLS helper functions are only needed by signed-in users.
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_editor_or_admin() from public, anon;
revoke all on function public.can_author_articles() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_editor_or_admin() to authenticated;
grant execute on function public.can_author_articles() to authenticated;
