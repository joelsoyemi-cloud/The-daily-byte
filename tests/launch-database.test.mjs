import test from 'node:test';
import fs from 'node:fs';
import {createRequire} from 'node:module';
test('Phase 11 feedback privacy, quotas, admin status access and avatar Storage ownership', {skip: !process.env.CAMPUS_PGLITE_PATH}, async()=>{
  const {PGlite}=createRequire(import.meta.url)(process.env.CAMPUS_PGLITE_PATH);
  const db=new PGlite();
  const bootstrap=`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select current_user::text $$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, owner uuid, name text, unique(bucket_id,name));
    create function storage.foldername(text) returns text[] language sql immutable as $$ select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1] $$;
    alter table storage.objects enable row level security;
    grant usage on schema public,auth,storage to anon,authenticated;
    grant execute on all functions in schema auth,storage to anon,authenticated;
    grant select,insert,update,delete on storage.objects to anon,authenticated;
  `;
  const migration=fs.readdirSync('supabase/migrations').find(name=>name.endsWith('_phase11_feedback_avatars.sql'));
  const sql=bootstrap+fs.readFileSync('supabase/schema.sql','utf8')+fs.readFileSync('lib/supabase/migrations/0001_roles_and_workflow.sql','utf8')+fs.readFileSync('lib/supabase/migrations/0002_rls_policies.sql','utf8')+'grant select on all tables in schema public to anon; grant select,insert,update,delete on all tables in schema public to authenticated;'+fs.readFileSync('lib/supabase/migrations/0003_campus_network.sql','utf8')+fs.readFileSync('supabase/migrations/'+migration,'utf8')+fs.readFileSync('tests/launch-rls.sql','utf8');
  try {await db.exec(sql);}finally{await db.close();}
});
