-- Run this in your Supabase project's SQL editor (Dashboard > SQL Editor > New query)

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  category text not null default 'General',
  cover_image text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

-- Keep updated_at current on every edit
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_set_updated_at on posts;
create trigger posts_set_updated_at
  before update on posts
  for each row execute procedure set_updated_at();

-- Row Level Security
alter table posts enable row level security;

-- Anyone (including logged-out visitors) can read published posts
create policy "Published posts are public"
  on posts for select
  using (published = true);

-- Logged-in users (you, the admin) can read everything, including drafts
create policy "Authenticated users can read all posts"
  on posts for select
  using (auth.role() = 'authenticated');

-- Logged-in users can create, update, delete
create policy "Authenticated users can insert posts"
  on posts for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update posts"
  on posts for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete posts"
  on posts for delete
  using (auth.role() = 'authenticated');

create index if not exists posts_published_idx on posts (published, published_at desc);

-- If you already ran this file once before the "category" column existed, run
-- just this line on its own to add it to your existing table:
-- alter table posts add column if not exists category text not null default 'General';
