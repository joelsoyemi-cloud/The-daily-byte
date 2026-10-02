insert into auth.users(id,email) values
('10000000-0000-4000-8000-000000000001','admin@test.invalid'),
('10000000-0000-4000-8000-000000000002','writer@test.invalid'),
('10000000-0000-4000-8000-000000000003','editor@test.invalid'),
('10000000-0000-4000-8000-000000000004','suspended@test.invalid'),
('10000000-0000-4000-8000-000000000005','reader@test.invalid');
alter table profiles disable trigger profiles_prevent_self_escalation;
update profiles set role='admin' where id in ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000004');
update profiles set role='editor' where id='10000000-0000-4000-8000-000000000003';
update profiles set role='reader' where id='10000000-0000-4000-8000-000000000005';
update profiles set status='suspended' where id='10000000-0000-4000-8000-000000000004';
alter table profiles enable trigger profiles_prevent_self_escalation;
do $$ begin
  if not exists(select 1 from storage.buckets where id='avatars' and public and file_size_limit=2097152 and allowed_mime_types=array['image/jpeg','image/png','image/webp']) then raise exception 'Unsafe bucket configuration'; end if;
end $$;
set role anon;
select set_config('request.jwt.claim.sub','',false);
select public.submit_feedback('bug','Anonymous report','A valid private bug report.','https://example.com/blog/story','private@test.invalid');
do $$ begin
  begin perform * from feedback_submissions; raise exception 'Anonymous private read allowed'; exception when insufficient_privilege then null; end;
  begin insert into feedback_submissions(type,title,message) values('bug','Bypass','A valid private bug report.'); raise exception 'Direct feedback insert allowed'; exception when insufficient_privilege then null; end;
  begin perform public.submit_feedback('bug','Bad URL','A valid private bug report.','javascript:alert(1)',null); raise exception 'Unsafe URL allowed'; exception when check_violation then null; end;
  begin perform public.submit_feedback('bug','Short','tiny',null,null); raise exception 'Short message allowed'; exception when check_violation then null; end;
end $$;
reset role;
insert into auth.users(id,email) values('10000000-0000-4000-8000-000000000006','missing-profile@test.invalid');
delete from profiles where id='10000000-0000-4000-8000-000000000006';
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000006',false);
select public.submit_feedback('bug','Missing profile','My contributor profile did not load.',null,null);
do $$ begin
  begin insert into storage.objects(bucket_id,name) values('avatars','10000000-0000-4000-8000-000000000006/20000000-0000-4000-8000-000000000006.jpg');raise exception 'Missing profile upload allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
select public.submit_feedback('suggestion','Signed in report','A useful suggestion for testing.',null,'ignored@test.invalid');
insert into storage.objects(bucket_id,name,owner) values('avatars','10000000-0000-4000-8000-000000000002/20000000-0000-4000-8000-000000000001.jpg',auth.uid());
do $$ declare affected integer; begin
  if exists(select 1 from feedback_submissions) then raise exception 'Contributor private feedback read allowed'; end if;
  begin insert into storage.objects(bucket_id,name) values('avatars','10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001.jpg'); raise exception 'Cross-user upload allowed'; exception when insufficient_privilege then null; end;
  begin insert into storage.objects(bucket_id,name) values('avatars','10000000-0000-4000-8000-000000000002/bad.svg'); raise exception 'Unsafe avatar path allowed'; exception when insufficient_privilege then null; end;
  update storage.objects set name='10000000-0000-4000-8000-000000000002/20000000-0000-4000-8000-000000000001.png' where bucket_id='avatars'; get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Avatar overwrite allowed'; end if;
  update feedback_submissions set status='resolved'; get diagnostics affected=row_count; if affected<>0 then raise exception 'Contributor feedback update allowed'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
insert into storage.objects(bucket_id,name,owner) values('avatars','10000000-0000-4000-8000-000000000003/20000000-0000-4000-8000-000000000003.webp',auth.uid());
do $$ declare affected integer; begin
  if exists(select 1 from feedback_submissions) then raise exception 'Editor private feedback read allowed'; end if;
  delete from storage.objects where name like '10000000-0000-4000-8000-000000000002/%';get diagnostics affected=row_count;if affected<>0 then raise exception 'Editor deleted another avatar'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
do $$ declare affected integer; begin
  if (select count(*) from feedback_submissions)<>3 then raise exception 'Admin feedback read failed'; end if;
  if not exists(select 1 from feedback_submissions where reporter_id is null and email='private@test.invalid') then raise exception 'Anonymous contact missing'; end if;
  if not exists(select 1 from feedback_submissions where reporter_id='10000000-0000-4000-8000-000000000002' and email is null and status='new') then raise exception 'Signed identity spoofed'; end if;
  update feedback_submissions set status='reviewing';update feedback_submissions set status='resolved';update feedback_submissions set status='ignored';update feedback_submissions set status='new';
  begin update feedback_submissions set status='invalid';raise exception 'Invalid status accepted';exception when check_violation then null;end;
  begin update feedback_submissions set email='changed@test.invalid';raise exception 'Private report editing allowed';exception when insufficient_privilege then null;end;
  delete from storage.objects where name like '10000000-0000-4000-8000-000000000002/%';get diagnostics affected=row_count;if affected<>0 then raise exception 'Admin bypassed avatar ownership';end if;
end $$;
insert into storage.objects(bucket_id,name,owner) values('avatars','10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001.png',auth.uid());
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',false);
do $$ begin
  if exists(select 1 from feedback_submissions) then raise exception 'Suspended admin read allowed';end if;
  begin perform public.submit_feedback('bug','Forbidden','A valid private bug report.',null,null);raise exception 'Suspended submission allowed';exception when raise_exception then if SQLERRM<>'Account unavailable' then raise;end if;end;
  begin insert into storage.objects(bucket_id,name) values('avatars','10000000-0000-4000-8000-000000000004/20000000-0000-4000-8000-000000000004.jpg');raise exception 'Suspended upload allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',false);
do $$ begin
  begin insert into storage.objects(bucket_id,name) values('avatars','10000000-0000-4000-8000-000000000005/20000000-0000-4000-8000-000000000005.jpg');raise exception 'Reader upload allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
do $$ begin
  for i in 1..4 loop perform public.submit_feedback('bug','Quota report','A valid private bug report.',null,null);end loop;
  begin perform public.submit_feedback('bug','Over quota','A valid private bug report.',null,null);raise exception 'Quota bypassed';exception when raise_exception then if SQLERRM<>'Feedback rate limit reached' then raise;end if;end;
end $$;
delete from storage.objects where name like '10000000-0000-4000-8000-000000000002/%';
reset role;
set role anon;
select set_config('request.jwt.claim.sub','',false);
do $$ begin
  if (select count(*) from storage.objects where bucket_id='avatars')<>2 then raise exception 'Public avatar visibility or owner deletion failed';end if;
  for i in 1..19 loop perform public.submit_feedback('other','Guest quota','A valid private bug report.',null,null);end loop;
  begin perform public.submit_feedback('bug','Over guest quota','A valid private bug report.',null,null);raise exception 'Anonymous quota bypassed';exception when raise_exception then if SQLERRM<>'Feedback rate limit reached' then raise;end if;end;
end $$;
reset role;
