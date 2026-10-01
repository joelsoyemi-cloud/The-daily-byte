import { createRequire } from "node:module";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
// Opt-in integration test. No external database URLs or application secrets are read.
test("PostgreSQL campus migration, constraints and RLS", { skip: process.env.CAMPUS_DB_TEST !== "1" && !process.env.CAMPUS_PGLITE_PATH }, async () => {
  const container = "daily-byte-phase9-db";
  const docker = args => execFileSync("docker", args, { encoding: "utf8", windowsHide: true });
  const bootstrap = `
    do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
    do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select current_user::text $$;
    create table storage.objects(id uuid primary key, bucket_id text, owner uuid);
    alter table storage.objects enable row level security;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on all functions in schema auth to anon, authenticated;
  `;
  const grants = "grant select on all tables in schema public to anon; grant select, insert, update, delete on all tables in schema public to authenticated;";
  const sql = bootstrap + fs.readFileSync("supabase/schema.sql", "utf8") + fs.readFileSync("lib/supabase/migrations/0001_roles_and_workflow.sql", "utf8") + fs.readFileSync("lib/supabase/migrations/0002_rls_policies.sql", "utf8") + grants + fs.readFileSync("lib/supabase/migrations/0003_campus_network.sql", "utf8") + fs.readFileSync("tests/campus-rls.sql", "utf8");
  if (process.env.CAMPUS_PGLITE_PATH) {
    const { PGlite } = createRequire(import.meta.url)(process.env.CAMPUS_PGLITE_PATH);
    const db = new PGlite();
    try { await db.exec(sql); } finally { await db.close(); }
    return;
  }
  assert.equal(docker(["inspect", "--format", '{{index .Config.Labels "daily-byte.phase"}}', container]).trim(), "9");
  const database = "campus_test_" + Date.now();
  docker(["exec", container, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-c", "create database " + database]);
  try {
    execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1"], { input: sql, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  } finally {
    docker(["exec", container, "psql", "-U", "postgres", "-c", "drop database " + database]);
  }
});
