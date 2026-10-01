import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import { safeHeadlineSource } from "../lib/source-url.ts";

const require = createRequire(import.meta.url);
function route(file, imports, env = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, Request, Response, URL, process: { env }, require: name => name in imports ? imports[name] : require(name) });
  return exports;
}
test("cron fails closed when the secret is missing, without creating a privileged client", async () => {
  let called = false;
  const { GET } = route("app/api/cron/publish-scheduled/route.ts", {
    "@/lib/supabase/service": { createServiceClient() { called = true; throw Error("must not run"); } },
  });
  const response = await GET(new Request("https://example.com/api/cron/publish-scheduled", { headers: { authorization: "Bearer undefined" } }));
  assert.equal(response.status, 401);
  assert.equal(called, false);
});
function draftRoute(user, profile) {
  let generated = false;
  const supabase = {
    auth: { async getUser() { return { data: { user } }; } },
    from() { return { select() { return this; }, eq() { return this; }, async single() { return { data: profile }; } }; },
  };
  const { POST } = route("app/api/generate-draft/route.ts", {
    "@/lib/supabase/server": { createClient: async () => supabase },
    "@/lib/ai": { generateArticleDraft() { generated = true; throw Error("private provider error"); } },
    "@/lib/media-search": {}, "@/lib/media": {}, "@/lib/posts": {},
    "@/lib/source-url": { safeHeadlineSource }, "@/lib/headlines": { HEADLINE_CATEGORIES: ["General", "Tech"] },
  });
  return { POST, generated: () => generated };
}
const request = (body) => new Request("https://example.com/api/generate-draft", { method: "POST", headers: { "content-type": "application/json" }, body });
test("draft generation denies anonymous, reader and suspended accounts before provider calls", async () => {
  for (const [user, profile, status] of [[null, null, 401], [{ id: "u" }, { role: "reader", status: "active" }, 403], [{ id: "u" }, { role: "admin", status: "suspended" }, 403]]) {
    const route = draftRoute(user, profile);
    assert.equal((await route.POST(request("{}"))).status, status);
    assert.equal(route.generated(), false);
  }
});
test("draft generation rejects malformed JSON and SSRF sources before provider calls", async () => {
  for (const body of ["{", JSON.stringify({ title: "Test", link: "http://127.0.0.1/admin" }), JSON.stringify({ title: "Test", link: "https://news.google.com.evil.example/articles/a" })]) {
    const route = draftRoute({ id: "u" }, { role: "contributor", status: "active" });
    assert.equal((await route.POST(request(body))).status, 400);
    assert.equal(route.generated(), false);
  }
});
test("provider failures return a generic message", async () => {
  const route = draftRoute({ id: "u" }, { role: "author", status: "active" });
  const response = await route.POST(request(JSON.stringify({ title: "Test", link: "https://news.google.com/rss/articles/abc" })));
  assert.equal(response.status, 503);
  assert.equal(route.generated(), true);
  assert.doesNotMatch(await response.text(), /private provider error/);
});
