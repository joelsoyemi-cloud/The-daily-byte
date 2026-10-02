P# Phase 8: Newsroom dashboard redesign

## Status

Implementation complete; safe for human review. Changes are intentionally uncommitted and unpushed.

## Role and workspace model

The actual role comes from the authenticated profile. Workspace labels describe the current location and never replace the role badge. Admin remains Admin in the Writing and Editorial workspaces.

| Role | Writing | Editorial | Admin |
| --- | --- | --- | --- |
| Contributor / Author | Yes | No | No |
| Editor | Yes | Yes | No |
| Admin | Yes | Yes | Yes |

The switcher exposes only accessible workspaces plus Public Site. All Create Story actions use /dashboard/articles/new. No /editor/articles/new route was added. Server guards, middleware and RLS remain the permission boundary; navigation is not authorization.

## Writing

The overview uses real status counts, a requested-changes callout, six recent stories and actionable links. Story lists use 20-row pagination and all existing statuses. Drafts open Continue writing, requested changes open Review changes, published stories open their public URL, and other statuses open the existing private view. The story editor retains its existing save/submit handlers and sanitized preview, with clearer labels, responsive controls and heading hierarchy.

Profiles show avatar/fallback, display name, existing username, bio and actual role. Display-name and bio updates retain the existing payload. Username remains read-only, and roles are explicitly managed from Admin. No campus fields were added.

## Editorial and Admin

Editorial focuses on submitted, under-review, requested-changes, approved, scheduled and published counts, plus the oldest queue updates. Queue rows retain existing editorial action handlers and show title, author, category, status and dates. Embedded history projections fetch only the latest submission and latest action per story; the parent list is paginated. Activity shows the latest 50 immutable decisions.

Admin is the platform command center, with four prominent actions: Create Story, Review Submissions, Manage Users and Manage Roles. Grouped navigation directly exposes Editorial Queue, Articles, Categories, Media, Review Activity, Users, Roles, Platform Settings, Advertising, Writing Workspace, Editorial Workspace and Public Site. Detailed management remains on the existing pages. Real user/role and content/status counts, pending editorial workload, six recent users and six recently updated stories provide context. The new recent-stories query uses the shared narrow projection without article bodies and remains server-rendered behind requireAdmin. The author directory now uses paginated role/status/join-date rows instead of downloading post rows for potentially truncated per-author totals. Users are also paginated. Categories, media, roles, settings and advertising receive a scoped consistency pass; no new settings or fake reporting were introduced.

## UI, accessibility and performance

The shell provides a fixed desktop sidebar and native modal mobile drawer, actual role badges, current-page navigation, profile/signout, public-site access and a workspace switcher. Drawer cleanup restores body scroll and focus; Escape, backdrop clicks and desktop resize close it. Statuses have text labels, controls have focus states and touch targets, and reduced-motion users receive no dashboard animation.

PublicChrome only hides public Header/Footer on authenticated workspace paths. It returns the existing public markup elsewhere. The authenticated shell no longer creates a nested main landmark. Styles use the existing brand colors, Archivo and Inter, rounded cards and restrained borders/shadows.

Pages and database reads remain server-rendered. New client code is limited to navigation and conditional public chrome; existing editing/profile components retain their interactive responsibilities. Queries use narrow projections, head-only exact counts, bounded lists and pagination. No packages or chart libraries were added.

## Verification

- npx tsc --noEmit: PASS.
- npm run lint: PASS, no warnings.
- npm run build: PASS.
- npm test: 22 tests passed, including the actual role guards, inaccessible workspace links, account-status denials, story actions and Admin role-label rendering in Writing/Editorial.
- git diff --check: PASS.
- Admin command-center follow-up: all 13 requested destinations and four quick actions verified; all nine requested widths passed without horizontal overflow. TypeScript, lint, build and all 22 tests passed again.
- Anonymous Supabase request accepted the embedded review-history projection without errors and returned zero private queue rows.
- Isolated browser harness rendered the real page/components with temporary role/data fixtures. No fixture route, fake dashboard data or harness bundle is part of the application. It made no production writes.
- Checked 16 dashboard routes at 320, 360, 390, 430, 768, 1024, 1280, 1440 and 1920 px, including long names and unbroken titles. No horizontal overflow or runtime exceptions were observed.
- Verified Contributor/Editor/Admin switchers, visible Admin role inside Writing, keyboard focus containment/restoration, Escape, backdrop versus panel clicks, link-close, resize cleanup, scroll restoration, and reduced motion. Open drawers/switchers passed all mobile/tablet widths.
- Story form label associations, a single page h1, and editing/preview roundtrip passed browser checks.
- Production public-page, metadata, canonical/pagination, RSS, sitemap, missing-route and anonymous dashboard/editor/admin redirect regression checks passed. Configured server secret values were absent from client bundles.

## Security and remaining manual checks

No changes to lib/auth.ts, middleware, Supabase clients, SQL/schema/RLS, API routes, cron, sanitizer code, package dependencies or public story queries. Editorial transition handlers and profile update permissions remain intact. No new any types were introduced in application code.

Automated role tests use mocked authentication and the actual guard implementation. Browser role tests use isolated fixtures, not real authenticated Supabase sessions. Before deployment, smoke-test real Contributor, Editor and Admin accounts: signout, profile save, draft save/submit, uploads, editorial transitions, and user-role/status management. The tests intentionally do not execute those production mutations. Existing browser-test fixtures cover populated states without creating users or stories.

No blocking implementation items remain. Existing username editing and general platform settings are not expanded by this visual phase. No commit or push was performed.

## Files created

| Path | Purpose |
| --- | --- |
| components/dashboard/DashboardNavigation.tsx | Accessible interactive sidebar/drawer and workspace switching. |
| components/dashboard/WorkspaceUI.tsx | Reusable headings, real-data metric cards, badges, lists and pagination. |
| components/dashboard/newsroom.css | Scoped brand styling, responsive shell/forms and reduced motion. |
| components/site/PublicChrome.tsx | Suppress public navigation only inside authenticated workspaces. |
| docs/phase8-newsroom.md | Implementation report, verification and manual checklist. |
| lib/newsroom.ts | Typed narrow story projections, exact counts and pagination parsing. |
| lib/workspaces.ts | Pure workspace labels/links and existing-status story actions. |
| tests/workspaces.test.mjs | Role matrix, switcher, story-action and actual Admin badge regressions. |

## Files modified

| Path | Purpose |
| --- | --- |
| app/admin/advertising/page.tsx | Scoped visual/accessibility consistency; existing behavior retained. |
| app/admin/layout.tsx | Workspace identity/navigation; existing guards remain unchanged. |
| app/admin/page.tsx | Real platform/user/content overview and management actions. |
| app/admin/roles/page.tsx | Scoped visual/accessibility consistency; existing behavior retained. |
| app/admin/settings/page.tsx | Useful existing management links and honest configuration state. |
| app/admin/users/page.tsx | Paginated user management with existing admin guard. |
| app/dashboard/articles/new/page.tsx | Clear story-creation heading; existing draft/submit behavior. |
| app/dashboard/articles/page.tsx | Paginated status-filtered story list and lifecycle-specific links. |
| app/dashboard/headlines/page.tsx | Scoped visual/accessibility consistency; existing behavior retained. |
| app/dashboard/layout.tsx | Workspace identity/navigation; existing guards remain unchanged. |
| app/dashboard/page.tsx | Writing overview, requested changes, exact counts and recent stories. |
| app/editor/activity/page.tsx | Typed, bounded editorial history presentation. |
| app/editor/articles/page.tsx | Paginated status-filtered story list and lifecycle-specific links. |
| app/editor/authors/page.tsx | Paginated writer directory and role/status badges. |
| app/editor/categories/page.tsx | Scoped visual/accessibility consistency; existing behavior retained. |
| app/editor/layout.tsx | Workspace identity/navigation; existing guards remain unchanged. |
| app/editor/media/page.tsx | Scoped visual/accessibility consistency; existing behavior retained. |
| app/editor/page.tsx | Editorial workload and bounded queue overview. |
| app/editor/submissions/page.tsx | Paginated queue with bounded embedded history and narrow types. |
| app/layout.tsx | Suppress public navigation only inside authenticated workspaces. |
| components/PostForm.tsx | Story-editor styling, labels, heading hierarchy and responsive controls. |
| components/admin/UsersTable.tsx | Responsive controls and accessible role selector; mutations unchanged. |
| components/dashboard/DashboardShell.tsx | Server shell, actual-profile role props and workspace content landmark. |
| components/dashboard/EmptyState.tsx | Consistent newsroom empty states and primary actions. |
| components/dashboard/NewArticleForm.tsx | Clear story-creation heading; existing draft/submit behavior. |
| components/dashboard/ProfileForm.tsx | Profile summary/avatar, read-only username/role and existing editable fields. |
| components/editor/CategoriesManager.tsx | Scoped visual/accessibility consistency; existing behavior retained. |
| components/editor/MediaLibrary.tsx | Scoped visual/accessibility consistency; existing behavior retained. |
| components/editor/SubmissionRow.tsx | Readable queue metadata and action presentation; handlers unchanged. |

