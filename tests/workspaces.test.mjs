import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { workspaceLinks, storyAction, WORKSPACE_LABELS } from "../lib/workspaces.ts";

test("workspace switching shows exactly the destinations allowed to each role", () => {
  for (const [role, expected] of [
    ["reader", ["public"]],
    ["contributor", ["writing", "public"]],
    ["author", ["writing", "public"]],
    ["editor", ["editorial", "writing", "public"]],
    ["admin", ["admin", "editorial", "writing", "public"]],
  ]) assert.deepEqual(workspaceLinks(role).map(link => link.id), expected);
  assert.equal(WORKSPACE_LABELS.writing, "Writing Workspace");
});
test("story actions follow the existing lifecycle and use the writing route for drafts", () => {
  const post = { id: "story-id", slug: "story/one", status: "draft" };
  assert.deepEqual(storyAction(post), { href: "/dashboard/articles/story-id/edit", label: "Continue writing" });
  assert.equal(storyAction({ ...post, status: "changes_requested" }).label, "Review changes");
  assert.equal(storyAction({ ...post, status: "published" }).href, "/blog/story%2Fone");
  for (const status of ["submitted", "under_review", "approved", "scheduled", "rejected", "archived"]) assert.equal(storyAction({ ...post, status }).href, "/dashboard/articles/story-id");
  assert.equal(storyAction(post, true).href, "/editor/articles/story-id/edit");
});
function auth(role, status = "active", signedIn = true) {
  const exports = {};
  const profile = { id: "fixture-user", role, status };
  const supabase = { auth: { async getUser() { return { data: { user: signedIn ? { id: profile.id } : null } }; } }, from() { return { select() { return this; }, eq() { return this; }, returns() { return this; }, async single() { return { data: profile }; } }; } };
  const code = ts.transpileModule(fs.readFileSync("lib/auth.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require(name) {
    if (name === "react") return { cache: fn => fn };
    if (name === "next/navigation") return { redirect(path) { throw new Error(path); } };
    if (name === "@/lib/supabase/server") return { createClient: async () => supabase };
    throw Error("Unexpected dependency");
  } });
  return exports;
}
test("actual server guards preserve the complete role/workspace hierarchy", async () => {
  for (const [role, allowed] of [["reader", []], ["contributor", ["requireContributor"]], ["author", ["requireContributor"]], ["editor", ["requireContributor", "requireEditor"]], ["admin", ["requireContributor", "requireEditor", "requireAdmin"]]]) {
    for (const guard of ["requireContributor", "requireEditor", "requireAdmin"]) {
      const guards = auth(role);
      if (allowed.includes(guard)) assert.equal((await guards[guard]()).role, role, role + ":" + guard);
      else await assert.rejects(guards[guard](), /\/unauthorized/);
    }
  }
});
test("suspended and pending accounts cannot use a workspace, including admins", async () => {
  for (const status of ["suspended", "pending"]) for (const guard of ["requireContributor", "requireEditor", "requireAdmin"]) await assert.rejects(auth("admin", status)[guard](), /\/unauthorized/);
  await assert.rejects(auth("admin", "active", false).requireAdmin(), /\/login/);
});

test("Admin keeps the actual Admin badge inside both Writing and Editorial workspaces", async () => {
  const React = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const jsx = await import("react/jsx-runtime");
  const workspaces = await import("../lib/workspaces.ts");
  const load = (file) => {
    const exports = {};
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(source, { exports, require(name) {
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "next/navigation") return { usePathname: () => "/dashboard" };
      if (name === "next/link") return { default: ({ children, ...props }) => React.createElement("a", props, children) };
      if (name === "@/lib/workspaces") return workspaces;
      if (name === "./WorkspaceUI") return load("components/dashboard/WorkspaceUI.tsx");
      if (name.includes("BrandLogo")) return { default: () => React.createElement("span", null, "The Daily Byte") };
      if (name.includes("SignOutButton")) return { default: () => React.createElement("button", null, "Sign out") };
      throw Error("Unexpected UI dependency: " + name);
    } });
    return exports;
  };
  const Navigation = load("components/dashboard/DashboardNavigation.tsx").default;
  for (const workspace of ["writing", "editorial"]) {
    const html = renderToStaticMarkup(React.createElement(Navigation, { role: "admin", displayName: "Test admin", workspace, nav: [{ href: "/dashboard", label: "Overview" }] }));
    assert.match(html, /data-role="admin"/);
    assert.ok(html.includes(workspaces.WORKSPACE_LABELS[workspace]));
    assert.doesNotMatch(html, /data-role="contributor"|data-role="editor"/);
  }
});
