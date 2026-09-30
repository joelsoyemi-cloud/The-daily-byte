do $$ begin
  create type user_role as enum ('reader', 'contributor', 'author', 'editor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_status as enum ('active', 'suspended', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type article_status as enum (
    'draft', 'submitted', 'under_review', 'changes_requested',
    'rejected', 'approved', 'scheduled', 'published', 'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_type as enum (
    'news', 'feature', 'opinion', 'editorial', 'interview',
    'press_release', 'sponsored', 'review', 'video'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_action as enum (
    'submitted', 'approved', 'rejected', 'changes_requested',
    'published', 'scheduled', 'unpublished', 'archived'
  );
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default 'New User',
  bio text,
  avatar_url text,
  role user_role not null default 'contributor',
  status user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'contributor',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

insert into profiles (id, display_name, role, status)
select
  id,
  coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1), 'Admin'),
  'admin',
  'active'
from auth.users
on conflict (id) do update set role = 'admin' where profiles.role <> 'admin';

create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_role user_role;
begin
  select role into acting_role from profiles where id = auth.uid();

  if acting_role is distinct from 'admin' then
    if new.role is distinct from old.role or new.status is distinct from old.status then
      new.role := old.role;
      new.status := old.status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_escalation on profiles;
create trigger profiles_prevent_self_escalation
  before update on profiles
  for each row execute procedure prevent_role_self_escalation();

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  parent_id uuid references categories(id),
  created_at timestamptz not null default now()
);

insert into categories (name, slug)
values
  ('General', 'general'),
  ('Entertainment', 'entertainment'),
  ('Music', 'music'),
  ('Tech', 'tech'),
  ('Business', 'business'),
  ('Lifestyle', 'lifestyle'),
  ('Sports', 'sports'),
  ('Politics', 'politics')
on conflict (slug) do nothing;

alter table posts add column if not exists author_id uuid references profiles(id);
alter table posts add column if not exists category_id uuid references categories(id);
alter table posts add column if not exists status article_status not null default 'draft';
alter table posts add column if not exists content_type content_type not null default 'news';
alter table posts add column if not exists featured boolean not null default false;
alter table posts add column if not exists breaking boolean not null default false;
alter table posts add column if not exists scheduled_at timestamptz;

update posts set status = 'published' where published = true and status = 'draft';

update posts
set author_id = (select id from profiles where role = 'admin' order by created_at asc limit 1)
where author_id is null;

update posts
set category_id = categories.id
from categories
where categories.slug = lower(posts.category)
  and posts.category_id is null;

create or replace function sync_post_status_published()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.author_id is null then
      new.author_id := auth.uid();
    end if;
    if new.published then
      new.status := 'published';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    new.published := (new.status = 'published');
  elsif new.published is distinct from old.published then
    if new.published then
      new.status := 'published';
    elsif old.status = 'published' then
      new.status := 'draft';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_sync_status_published on posts;
create trigger posts_sync_status_published
  before insert or update on posts
  for each row execute procedure sync_post_status_published();

create table if not exists review_history (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  reviewer_id uuid references profiles(id),
  action review_action not null,
  feedback text,
  created_at timestamptz not null default now()
);

create index if not exists review_history_post_idx on review_history (post_id, created_at desc);