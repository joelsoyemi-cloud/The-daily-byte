create or replace function is_editor_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('editor', 'admin')
  );
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function can_author_articles()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('contributor', 'author', 'editor', 'admin')
      and status = 'active'
  );
$$;

alter table profiles enable row level security;

drop policy if exists "Profiles are publicly readable" on profiles;
create policy "Profiles are publicly readable"
  on profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

drop policy if exists "Admins can update any profile" on profiles;
create policy "Admins can update any profile"
  on profiles for update
  using (is_admin());

alter table categories enable row level security;

drop policy if exists "Categories are publicly readable" on categories;
create policy "Categories are publicly readable"
  on categories for select
  using (true);

drop policy if exists "Editors and admins manage categories" on categories;
create policy "Editors and admins manage categories"
  on categories for all
  using (is_editor_or_admin())
  with check (is_editor_or_admin());

drop policy if exists "Published posts are public" on posts;
drop policy if exists "Authenticated users can read all posts" on posts;
drop policy if exists "Authenticated users can insert posts" on posts;
drop policy if exists "Authenticated users can update posts" on posts;
drop policy if exists "Authenticated users can delete posts" on posts;

alter table posts enable row level security;

create policy "Public can read published posts"
  on posts for select
  using (status = 'published');

create policy "Authors can read their own posts"
  on posts for select
  using (author_id = auth.uid());

create policy "Editors and admins can read all posts"
  on posts for select
  using (is_editor_or_admin());

create policy "Contributors can create their own drafts"
  on posts for insert
  with check (
    can_author_articles()
    and author_id = auth.uid()
    and status in ('draft', 'submitted')
  );

create policy "Authors can edit their own editable posts"
  on posts for update
  using (
    author_id = auth.uid()
    and status in ('draft', 'changes_requested')
  )
  with check (
    author_id = auth.uid()
    and status in ('draft', 'submitted')
  );

create policy "Editors and admins can update any post"
  on posts for update
  using (is_editor_or_admin())
  with check (is_editor_or_admin());

create policy "Authors can delete their own drafts"
  on posts for delete
  using (author_id = auth.uid() and status = 'draft');

create policy "Editors and admins can delete any post"
  on posts for delete
  using (is_editor_or_admin());

alter table review_history enable row level security;

create policy "Authors can read their own review history"
  on review_history for select
  using (
    exists (
      select 1 from posts
      where posts.id = review_history.post_id
      and posts.author_id = auth.uid()
    )
  );

create policy "Editors and admins can read all review history"
  on review_history for select
  using (is_editor_or_admin());

create policy "Editors and admins can log review actions"
  on review_history for insert
  with check (is_editor_or_admin());

create policy "Authors can log their own submission"
  on review_history for insert
  with check (
    action = 'submitted'
    and reviewer_id = auth.uid()
    and exists (
      select 1 from posts
      where posts.id = review_history.post_id
      and posts.author_id = auth.uid()
    )
  );

drop policy if exists "Authenticated can upload media" on storage.objects;
drop policy if exists "Authenticated can update media" on storage.objects;
drop policy if exists "Authenticated can delete media" on storage.objects;

create policy "Contributors can upload media"
  on storage.objects for insert
  with check (bucket_id = 'media' and can_author_articles());

create policy "Users can update their own media"
  on storage.objects for update
  using (bucket_id = 'media' and owner = auth.uid());

create policy "Users can delete their own media, editors delete any"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and (owner = auth.uid() or is_editor_or_admin())
  );