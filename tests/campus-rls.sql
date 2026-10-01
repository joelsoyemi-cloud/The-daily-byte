-- Runs only in the disposable database created by campus-database.test.mjs.
insert into auth.users (id, email) values
('10000000-0000-4000-8000-000000000001', 'admin@test.invalid'),
('10000000-0000-4000-8000-000000000002', 'writer@test.invalid'),
('10000000-0000-4000-8000-000000000003', 'editor@test.invalid'),
('10000000-0000-4000-8000-000000000004', 'suspended@test.invalid');
-- Test fixture setup as the local database owner only.
alter table profiles disable trigger profiles_prevent_self_escalation;
update profiles set role = 'admin' where id in ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004');
update profiles set role = 'editor' where id = '10000000-0000-4000-8000-000000000003';
update profiles set status = 'suspended' where id = '10000000-0000-4000-8000-000000000004';
alter table profiles enable trigger profiles_prevent_self_escalation;
insert into schools (id, name, slug, status) values ('20000000-0000-4000-8000-000000000001', 'Inactive test fixture', 'inactive-test', 'inactive');

insert into posts(title,slug,content,status,scheduled_at) values
('Due','due-story','Test','scheduled',now()-interval '1 hour'),
('Future','future-story','Test','scheduled',now()+interval '1 hour'),
('Submitted','submitted-story','Test','submitted',null),
('Rejected','rejected-story','Test','rejected',null),
('Published','published-story','Test','published',null);
set role anon;
do $$ begin
  if not exists (select 1 from posts where slug = 'due-story') then raise exception 'Due scheduled story unavailable'; end if;
  if not exists (select 1 from posts where slug = 'published-story') then raise exception 'Published story unavailable'; end if;
  if exists (select 1 from posts where slug in ('future-story','submitted-story','rejected-story')) then raise exception 'Nonpublic stories leaked'; end if;
  if (select count(*) from schools) <> 1 then raise exception 'Anonymous school visibility failed'; end if;
  begin
    insert into schools(name, slug) values ('Forbidden', 'forbidden');
    raise exception 'Anonymous insert was allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', false);
do $$ declare campus uuid; affected integer; begin
  select id into campus from schools where short_name = 'OOU';
  if campus is null then raise exception 'OOU missing'; end if;
  update profiles set school_id = campus, role = 'admin' where id = auth.uid();
  if (select role from profiles where id = auth.uid()) <> 'contributor' then raise exception 'School update escalated role'; end if;
  if (select school_id from profiles where id = auth.uid()) <> campus then raise exception 'Affiliation did not save'; end if;
  begin
    insert into schools(name, slug) values ('Forbidden', 'forbidden');
    raise exception 'Contributor insert allowed';
  exception when insufficient_privilege then null; end;
  update schools set name = 'Forbidden' where id = campus;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Contributor school update allowed'; end if;
  begin
    update profiles set school_id = '20000000-0000-4000-8000-000000000001' where id = auth.uid();
    raise exception 'Inactive selection allowed';
  exception when check_violation then null; end;
  begin
    update profiles set school_id = '99999999-0000-4000-8000-000000000001' where id = auth.uid();
    raise exception 'Unknown selection allowed';
  exception when check_violation then null; end;
  insert into posts(title,slug,content,author_id,school_id,status) values ('Campus draft','campus-draft','Test',auth.uid(),campus,'draft');
  insert into posts(title,slug,content,author_id,school_id,status) values ('General draft','general-draft','Test',auth.uid(),null,'draft');
  update profiles set school_id = null where id = auth.uid();
  if (select school_id from posts where slug = 'campus-draft') <> campus then raise exception 'Profile changed story affiliation'; end if;
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', false);
do $$ begin
  begin
    insert into schools(name,slug) values('Forbidden','forbidden');
    raise exception 'Editor managed schools';
  exception when insufficient_privilege then null; end;
  update profiles set school_id = (select id from schools where short_name = 'OOU') where id = auth.uid();
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', false);
do $$ declare affected integer; begin
  update schools set name = 'Forbidden' where short_name = 'OOU';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Suspended admin managed schools'; end if;
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', false);
do $$ begin
  if (select count(*) from schools) <> 2 then raise exception 'Admin cannot see inactive schools'; end if;
  insert into schools(name,slug) values('Local test fixture','local-test');
  update schools set status = 'inactive' where short_name = 'OOU';
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', false);
do $$ begin
  -- An inactive association remains editable/clearable without silently relabeling stories.
  update posts set school_id = school_id, title = 'Still editable' where slug = 'campus-draft';
  update posts set school_id = null where slug = 'campus-draft';
  begin
    delete from schools;
    raise exception 'School deletion allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '', false);
set role anon;
do $$ begin
  if exists (select 1 from schools where short_name = 'OOU') then raise exception 'Inactive school public'; end if;
  if exists (select 1 from posts where slug in ('campus-draft','general-draft')) then raise exception 'Private stories leaked'; end if;
end $$;
reset role;
