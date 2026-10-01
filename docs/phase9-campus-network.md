# Phase 9: Campus network

## Status and rollout

Implementation complete; SAFE FOR HUMAN REVIEW: YES. Target-database rollout remains pending. No commit, push, or production database write has been performed.

**Apply migration 0003 before deploying this application version.** Profile and story queries now reference schools. Deploying the application first would cause query failures. Test the migration on staging, then apply the same reviewed migration to production through the normal database change process.

Migration: `lib/supabase/migrations/0003_campus_network.sql`.

- Back up the database and inspect the existing migration history.
- On the existing Phase 8 database, run **only 0003**, once, in a transaction. Do not replay 0001: its historical bootstrap includes role backfilling.
- Verify the schools table, RLS policies, two foreign keys, validation triggers, indexes, and the single OOU seed.
- Refresh the PostgREST schema cache if the platform has not already done so: `NOTIFY pgrst, 'reload schema';`.
- Verify the new joins and role matrix in staging, then deploy the application.
- For application rollback, restore the Phase 8 application and leave the additive schema/data in place. Do not drop affiliation columns or the table after users have started saving affiliations without a separate data-preservation plan.

The migration is additive and transactional; it is not an idempotent bootstrap script. An already-applied migration should not be rerun.

## Database and schools

`schools` contains UUID id, name, unique slug, optional short name, institution type, optional city/state/country, optional logo URL, optional description, active/inactive status, and creation timestamp. Text lengths, slug format, supported types/statuses and HTTPS logo format are constrained. Optional `profiles.school_id` and `posts.school_id` foreign keys have indexes.

The only seeded institution is **Olabisi Onabanjo University (OOU)**, slug `olabisi-onabanjo-university`, type university. No address, description, official logo, partnership, verification status or invented institutions are seeded. The optional logo field is reserved in the model; this phase does not introduce a logo upload/display workflow or relax image-host restrictions.

## Profile and story affiliation

The profile selector offers active database records and an explicit empty choice. Display name, bio and school can be saved; role remains read-only. Writing overview and public author pages show an active school when selected.

New stories default to the writer's active profile school. Writers may clear it for general stories. Existing stories use their own saved school; profile changes do not relabel previous work. Writing and editorial editing save school alongside existing fields without changing statuses, authorship or transition handlers.

Inactive school associations are retained. Existing forms show an unavailable-school option and can preserve or clear it. Newly assigning an inactive or nonexistent school is rejected by the database.

## Public pages and SEO

- `/schools`: paginated active institutions, 24 per page.
- `/schools/[slug]`: active school identity, optional description, paginated public stories, up to 12 active contributor/author/editor/admin profiles with usernames, and honest empty/error states.
- Articles and authors link subtly to active campus pages.
- Footer gains a Campus network link; existing public design is retained.
- Existing metadata helper supplies titles, descriptions, absolute canonical/OG URLs and branded social fallback. Pagination has self-canonicals.
- Sitemap includes the directory and active schools in bounded batches.
- Unknown/inactive campuses return 404. No official institutional structured data is invented.
- Campus association is explicitly described as self-selected and not endorsement or partnership.

Public story requests preserve `published OR (scheduled AND scheduled_at <= now)`, including for signed-in editors/admins. Lists project no article bodies.

## Dashboard and Admin

Admin sidebar and command center link to `/admin/schools`. Admins can add, edit, activate and deactivate institutions. The server action rechecks requireAdmin, validates an allowlisted payload, uses the ordinary authenticated server client, and relies on RLS as well. Slugs are read-only after creation in management UI/action to preserve URLs.

Writing and editorial rows show school when available. Editorial Articles supports an active-school filter, retained across status links and pagination. Submission rows display school; the queue's existing workflow remains intact.

Pages and school reads stay server-rendered. Existing form clients receive narrow id/name choices. No new dependencies, chart libraries or additional client-side fetch loops were added.

## Security and RLS

- Anonymous and authenticated users can SELECT active schools.
- Only active admins may create/update school records or read inactive records.
- No school DELETE permission is granted to application roles; deactivate instead.
- Association validation is a security-invoker trigger with an empty search path and schema-qualified reads.
- Existing profile/post write policies and self-escalation prevention remain unchanged. School selection grants no role, workspace or editorial permission.
- The checked-in 0002 baseline only exposes published posts. 0003 adds a narrowly scoped SELECT policy for scheduled posts whose timestamp is due, matching the existing public contract. It grants no write access and excludes future/null scheduled times. No existing policy is dropped or replaced.
- Auth guard functions, middleware, Supabase clients, cron, sanitizer and JSON-LD escaping are unchanged apart from adding school fields to the profile projection.
- No service-role client or secret is introduced.

References used to check SQL behavior: [PostgreSQL trigger documentation](https://www.postgresql.org/docs/current/sql-createtrigger.html) and [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Verification

- npx tsc --noEmit: PASS.
- npm run lint: PASS.
- npm run build: PASS (final build completed outside the Windows sandbox after a sandbox access failure).
- Full test suite: 27 PASS, zero failed/skipped, including the SQL migration/RLS test.
- npm test passed its 26 ordinary tests; the opt-in database test was then enabled. A parallel run hit Windows spawn EPERM, so the final complete run used node --experimental-strip-types --test --test-concurrency=1 tests/*.test.mjs with CAMPUS_PGLITE_PATH set.
- git diff --check: PASS. No staged files.
- SQL executed successfully in an isolated in-memory PGlite PostgreSQL engine installed in TEMP only. Docker Hub failed during its image pull; no Docker/PostgreSQL production connection was used. The temporary engine is not a project dependency.
- SQL cases cover OOU seeding, public active-only school reads, non-admin management denials, suspended-admin denial, valid/invalid/inactive affiliations, role-escalation protection, optional general stories, independent profile/story affiliation, deactivation and preservation/clearing, due scheduled visibility and future/private exclusions.
- Existing auth, role, cron, redirect, SSRF and Markdown/XSS regressions passed.
- Native Supabase/PostgREST staging smoke tests remain required before deployment.

Responsive fixture testing covers /schools, a campus page, author profile, /admin/schools, Writing overview/profile/new story, Editorial Articles and Submissions at 320, 360, 390, 430, 768, 1024, 1280, 1440 and 1920 pixels. These are isolated fixtures rendering the real components, not production writes or live authenticated sessions. No horizontal overflow was observed. Profile/story default selection and clearing passed.

Database integration tests are opt-in: start a disposable PostgreSQL 16 container named `daily-byte-phase9-db`, labeled `daily-byte.phase=9`, with no external network/ports. Then set `CAMPUS_DB_TEST=1` and run `npm test`. The test verifies the container label, creates its own fresh test database, installs the checked-in baseline plus migration, exercises role/constraint cases, and drops only that test database. It never reads application environment secrets or connects to production. Alternatively, install @electric-sql/pglite into a temporary directory outside the project and set CAMPUS_PGLITE_PATH to that package directory; the same SQL suite then runs in memory without Docker. This fallback was used for this review. See [PGlite documentation](https://pglite.dev/docs/).

## Manual testing before deployment

1. Apply 0003 in staging; verify OOU appears, joins resolve, and there is no unintended role/status change.
2. Sign in as Contributor, Editor and Admin. Check the unchanged workspace hierarchy and the actual Admin badge in Writing.
3. Select OOU on a profile, save/reload, confirm public author affiliation. Clear it and verify old stories retain their school.
4. Create a story: default OOU, clear for a general story, save draft, edit, submit, request changes, resubmit and publish through the existing workflow.
5. As Admin, add/edit/deactivate/reactivate a real test institution in staging. Confirm contributor/editor direct API management requests are denied.
6. On deactivation, verify campus 404/sitemap omission, no new selections, existing drafts remain editable and affiliations can be cleared.
7. Confirm campus listings include published and due scheduled stories, but never drafts, submissions, rejected or future scheduled stories—even while logged in as Admin.
8. Check article campus link, author campus link, filters/pagination, mobile keyboard/focus, error/empty states and long school names.
9. Confirm cron still publishes due scheduled stories normally. School association never changes the review or publishing workflow.

## Known limitations

- The migration must be applied to the target database before this code is deployed.
- School logos are optional model data only; no logo upload workflow is added.
- Slug changes/redirect management, school requests, ambassadors, campus editors, verification, events and opportunities are intentionally not implemented.
- No real production mutations or live authenticated end-to-end role workflows were performed.

## Files

The final file inventory follows below.

### Files created

- app/admin/schools/actions.ts
- app/admin/schools/page.tsx
- app/schools/[slug]/page.tsx
- app/schools/page.tsx
- components/SchoolSelect.tsx
- docs/phase9-campus-network.md
- lib/schools-server.ts
- lib/schools.ts
- lib/supabase/migrations/0003_campus_network.sql
- tests/campus-database.test.mjs
- tests/campus-rls.sql
- tests/campus.test.mjs

### Files modified

- app/admin/layout.tsx
- app/admin/page.tsx
- app/author/[username]/page.tsx
- app/blog/[slug]/page.tsx
- app/dashboard/articles/[id]/edit/page.tsx
- app/dashboard/articles/new/page.tsx
- app/dashboard/page.tsx
- app/dashboard/profile/page.tsx
- app/editor/articles/[id]/edit/page.tsx
- app/editor/articles/page.tsx
- app/editor/submissions/page.tsx
- app/sitemap.ts
- components/PostForm.tsx
- components/dashboard/EditArticleForm.tsx
- components/dashboard/NewArticleForm.tsx
- components/dashboard/ProfileForm.tsx
- components/dashboard/WorkspaceUI.tsx
- components/editor/EditorArticleForm.tsx
- components/editor/SubmissionRow.tsx
- components/site/Footer.tsx
- lib/auth.ts
- lib/newsroom.ts
- lib/posts.ts
- lib/public-listings.ts
