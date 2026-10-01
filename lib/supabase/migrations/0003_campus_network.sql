begin;

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  slug text not null unique check (length(slug) between 1 and 180 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_name text check (length(short_name) <= 40),
  type text not null default 'university' check (type in ('university', 'polytechnic', 'college', 'secondary_school')),
  city text check (length(city) <= 100),
  state text check (length(state) <= 100),
  country text check (length(country) <= 100),
  logo_url text check (length(logo_url) <= 2048 and logo_url ~ '^https://'),
  description text check (length(description) <= 2000),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

alter table public.profiles add column school_id uuid references public.schools(id) on delete set null;
alter table public.posts add column school_id uuid references public.schools(id) on delete set null;
create index profiles_school_idx on public.profiles(school_id);
create index posts_school_public_idx on public.posts(school_id, status, published_at desc);
-- Align the checked-in baseline with the existing public visibility contract.
-- This adds SELECT access only once a scheduled story is due.
create policy "Public reads due scheduled stories" on public.posts for select to anon, authenticated
using (status = 'scheduled' and scheduled_at <= now());

alter table public.schools enable row level security;
revoke all on public.schools from anon, authenticated;
grant select on public.schools to anon, authenticated;
grant insert, update on public.schools to authenticated;

create policy "Public reads active schools" on public.schools for select to anon, authenticated
using (status = 'active');
create policy "Active admins read all schools" on public.schools for select to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active'));
create policy "Active admins create schools" on public.schools for insert to authenticated
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active'));
create policy "Active admins update schools" on public.schools for update to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active'))
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active'));

-- Additive validation only: existing profile/post policies and role-protection
-- triggers still control who may write and which workflow transitions are allowed.
create function public.validate_school_selection() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if new.school_id is not distinct from old.school_id then return new; end if;
  end if;
  if new.school_id is not null and not exists (
    select 1 from public.schools where id = new.school_id and status = 'active'
  ) then
    raise exception 'Choose an active school or leave the school empty.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger profiles_validate_school before insert or update of school_id on public.profiles
for each row execute function public.validate_school_selection();
create trigger posts_validate_school before insert or update of school_id on public.posts
for each row execute function public.validate_school_selection();

insert into public.schools (name, slug, short_name, type)
values ('Olabisi Onabanjo University', 'olabisi-onabanjo-university', 'OOU', 'university');
commit;
