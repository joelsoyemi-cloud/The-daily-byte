import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function load(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, URL, URLSearchParams, Date, require(name) { if (name in mocks) return mocks[name]; throw Error("Unexpected dependency: " + name); } });
  return exports;
}
test("campus story listing keeps visibility, narrow projection and bounded pagination", async () => {
  const calls = [], q = {};
  for (const name of ["select", "or", "eq", "order", "range"]) q[name] = (...args) => { calls.push([name, ...args]); return q; };
  q.returns = async () => ({ data: [], count: 0, error: null });
  const { getPublicStories } = load("lib/public-listings.ts", { "@/lib/supabase/server": { createClient: async () => ({ from: () => q }) }, "./site": {} });
  await getPublicStories({ page: 2, schoolId: "campus-id" });
  assert.ok(calls.some(c => c[0] === "eq" && c[1] === "school_id" && c[2] === "campus-id"));
  assert.match(calls.find(c => c[0] === "or")[1], /^status.eq.published,and\(status.eq.scheduled,scheduled_at.lte.\d{4}-.*\)$/);
  assert.doesNotMatch(calls.find(c => c[0] === "select")[1], /(^|,\s*)content(,|$)/);
  assert.deepEqual(calls.find(c => c[0] === "range").slice(1), [12, 23]);
});
test("school save rechecks Admin, rejects invalid input and never writes role fields", async () => {
  const calls = [];
  let allowed = false;
  const q = { update(value) { calls.push(value); return q; }, insert(value) { calls.push(value); return q; }, eq() { return q; }, select() { return q; }, async single() { return { data: { slug: "oou" }, error: null }; } };
  const { saveSchool } = load("app/admin/schools/actions.ts", {
    "@/lib/auth": { requireAdmin: async () => { if (!allowed) throw Error("denied"); } },
    "@/lib/supabase/server": { createClient: async () => ({ from: () => q }) },
    "next/cache": { revalidatePath() {} }, "next/navigation": { redirect(path) { throw Error(path); } },
    "@/lib/schools": { SCHOOL_TYPES: ["university", "polytechnic", "college", "secondary_school"] },
  });
  const form = new FormData();
  for (const [k, v] of Object.entries({ name: "Olabisi Onabanjo University", slug: "oou", type: "university", status: "active", role: "admin" })) form.set(k, v);
  await assert.rejects(saveSchool(form), /denied/); assert.equal(calls.length, 0);
  allowed = true; form.set("slug", "bad/slug"); await assert.rejects(saveSchool(form), /error=invalid/); assert.equal(calls.length, 0);
  form.set("slug", "oou"); await assert.rejects(saveSchool(form), /saved=1/);
  assert.equal(calls.length, 1); assert.equal(calls[0].name, "Olabisi Onabanjo University");
  assert.equal(calls[0].role, undefined); assert.equal(calls[0].school_id, undefined);
  form.set("id", "11111111-1111-4111-8111-111111111111"); form.set("slug", "changed");
  await assert.rejects(saveSchool(form), /saved=1/); assert.equal(calls[1].slug, undefined);
});
test("campus lookup and choices explicitly require active schools", async () => {
  const calls = [], q = {};
  for (const name of ["select", "eq", "order", "range"]) q[name] = (...args) => { calls.push([name, ...args]); return q; };
  q.returns = () => q; q.maybeSingle = async () => ({ data: null, error: null });
  q.then = resolve => Promise.resolve({ data: [], error: null }).then(resolve);
  const helpers = load("lib/schools-server.ts", { "server-only": {}, react: { cache: f => f }, "@/lib/supabase/public": { createPublicClient: () => ({ from: () => q }) }, "./schools": { SCHOOL_SELECT: "id, name, slug, status" } });
  assert.equal(await helpers.getSchool("inactive"), null);
  await helpers.getSchoolOptions();
  assert.equal(calls.filter(c => c[0] === "eq" && c[1] === "status" && c[2] === "active").length, 2);
});

test("sitemap includes active campus URLs with the existing absolute site URL", async () => {
  const calls = [];
  const client = { from(table) {
    const q = {};
    for (const name of ["select", "eq", "order", "range", "or", "not"]) q[name] = (...args) => { calls.push([table, name, ...args]); return q; };
    q.returns = async () => ({ data: table === "schools" ? [{ slug: "olabisi-onabanjo-university" }] : [], error: null });
    return q;
  } };
  const { default: sitemap } = load("app/sitemap.ts", {
    "@/lib/supabase/public": { createPublicClient: () => client },
    "@/lib/site": { SITE_URL: new URL("https://publication.example") },
  });
  const entries = await sitemap();
  assert.ok(entries.some(e => e.url === "https://publication.example/schools"));
  assert.ok(entries.some(e => e.url === "https://publication.example/schools/olabisi-onabanjo-university"));
  assert.ok(calls.some(c => c[0] === "schools" && c[1] === "eq" && c[2] === "status" && c[3] === "active"));
});
