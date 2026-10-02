# PHASE 11 — Launch readiness and early tester feedback

## PHASE 11 STATUS

Implementation complete for local review. Target-database rollout and live authenticated staging tests remain pending. No commit, push, deployment, production database mutation, real signup, email resend, feedback submission, or avatar upload was performed.

Apply `supabase/migrations/20261002102340_phase11_feedback_avatars.sql` once to the reviewed Phase 9 database before deploying this application version. Test it on staging first. Do not replay the historical role-backfill bootstrap in 0001. The new migration is additive and transactional, with no replacements of existing auth, profile, post, school, or editorial policies.

## FEEDBACK SYSTEM

`/feedback` is available from the public footer, `/write`, Writing overview, and the authenticated workspace navigation. It accepts Bug, Suggestion, Content issue, or Other; a short title; a message; optional page URL; and optional contact email for guests. Signed-in reporters are identified using the database's authenticated user ID, not a submitted ID. Email is not automatically copied from Auth.

The form has labelled fields, bounded lengths, busy/error/success states, a honeypot, and preserves input on failure. URL queries and fragments are removed, credential-bearing or non-HTTP URLs are rejected, and no supplied URL is fetched. Contact information and messages are stored in `feedback_submissions` and are not readable by public users, contributors, or editors.

`/admin/feedback` provides a paginated private queue, status filters, and new/reviewing/resolved/ignored updates. Both the page and update action require an active Admin; RLS also enforces active-Admin access. Application roles can update only the status column, not reporter details or report content. There is no public read API or application deletion permission.

Submissions use a security-invoker RPC wrapper and a narrowly scoped fixed-payload insertion helper in the non-exposed `app_private` schema. Direct table inserts are denied. The helper checks caller identity, permits real signed-in accounts with missing profiles to report that problem, rejects unavailable accounts, and uses a transaction advisory lock to enforce quotas even for direct RPC calls.

Quotas: 5/minute and 20/hour per signed-in reporter; a shared 20/minute and 100/hour guest quota; and 300/hour overall. These limits count recent submissions independently of review status. They are intentionally small for early testing; they are not per-IP throttling or CAPTCHA.

## EARLY ACCESS UX

The existing subtle notice now says the platform is in testing, students are invited to try it, feedback is welcome, and the official launch comes later. It remains in the public footer, `/write`, signup, and Writing overview. No fake partnerships, testimonials, notifications, analytics, or contributor counts were added.

## ONBOARDING

The student journey remains `/write` → signup → email confirmation/login → Writing profile → optional OOU selection → first draft → Submit for review → status/editorial history. The existing onboarding page and dashboard guidance explain who the publication is for and what happens after submission.

New accounts previously had no public username and a permanently read-only username field. Profile completion now allows a first username to be selected once. Existing usernames remain read-only in this flow to preserve shared author links. Server validation restricts profile updates to display name, bio, school, and first username; supplied role/ID fields are ignored. Database ownership and role-protection remain in force.

Confirmation-required and immediate-session signup branches remain supported. Confirmation resend is available after signup and on the invalid-link login recovery state. Resend responses avoid claiming whether an account exists. Actual email delivery is not verified here; redirects and email configuration must be checked in staging.

## ADMIN TESTING TOOLS

The existing `/admin` layout now includes recent profile signups, recent recorded submission/resubmission events, unresolved feedback count (new + reviewing), and quick links to Feedback, Users, and Submissions. Queries are bounded and use real Supabase data. Failed feedback counts are shown as unavailable, rather than zero. Recent submission events have a partial index. The Phase 8 workspace hierarchy and actual role badges remain intact.

## PROFILE PICTURES

Active contributors, authors, editors, and admins can upload/change their own avatar on `/dashboard/profile`. This uses the existing `profiles.avatar_url` and a dedicated public `avatars` Storage bucket. Only JPEG, PNG, and WebP are accepted, up to 2 MB. Client decoding/re-encoding strips metadata and resizes to a maximum side of 1024px without cropping; large images over 25 megapixels are rejected after decoding. Server-side size, MIME, and signature checks run before upload. The bucket also enforces its MIME allowlist and 2 MB size limit through the Storage API.

Names are generated as `<authenticated-user-id>/<random-uuid>.<extension>`; original filenames and caller-supplied user IDs are not used. Uploads do not upsert. Storage policies allow public image reads and active writers' own-folder inserts/deletes, with no avatar update policy or Admin ownership bypass.

Replacement order: upload a new object; save its URL using a compare-and-set on the previous URL; then delete the previous managed object. Confirmed rejected/concurrent profile updates preserve the previous avatar and attempt to remove the new upload. If the save response is lost or uncertain, the new object is retained because the profile may already reference it; the user is asked to refresh. Cleanup never deletes another user's image, an external URL, or an existing media-bucket file. Old-image cleanup failure is reported after a successful save. Temporary Storage failures may leave an orphan; cleanup is best-effort across separate database/Storage operations.

Current avatar preview and initials fallback are provided. Managed avatars display in the profile summary, workspace navigation, public author page, article author box, and Editor author list. Failed/invalid images fall back to initials. Pictures are explicitly described as public. Cropping and a cropping library are deferred.

## ERROR HANDLING

- Invalid confirmation links: clear login recovery guidance, confirmation resend, reset-link request, and feedback links.
- Expired/missing reset session: Reset link unavailable and Request a new link; network failures stop the busy state.
- Missing profile: a recovery page rather than a login loop, with homepage, feedback, and sign-out actions. Reporting remains possible without a profile.
- Failed story save: human messages for duplicate slugs, invalid/unavailable selections, expired sign-in, and connection failures. Text remains in the form. Zero-row updates are not treated as success.
- Failed image upload: format/size/decode guidance or a connection/sign-in retry message. Existing writing stays intact.
- Unavailable school: the optional empty selection stays usable; existing unavailable affiliations remain visible; invalid new choices get a clear error.
- Broken article URL: the public human-readable 404 and homepage recovery link remain intact.

The editorial transition rules and review queue remain unchanged. There is no autosave, automatic publication, or background notification feature implied by the error messages.

## MOBILE

Real-component isolated browser fixtures passed at 320, 360, 390, 430, 768, and 1440 pixels for signup, login, `/write`, Writing overview, story editor, profile/avatar flow, OOU campus, sharing, feedback form, Admin overview, Admin feedback, and Editor authors. No horizontal overflow was observed. Profile/avatar and feedback screenshots were visually reviewed at 390px. Auth inputs/buttons have 44px minimum targets, and auth input text is 16px to avoid automatic focus zoom in common mobile browsers.

Interactive fixtures verified first byline setup, rejected SVG avatars, valid PNG decoding and WebP re-encoding, successful avatar preview, feedback success/failure with retained text, Admin status update, and copy-link behavior. These fixtures use fake responses in temporary tooling only; the production application contains no fixture records or fake metrics. Actual authenticated Storage/PostgREST workflows and mobile devices still need staging checks.

## WHATSAPP/SHARING

The production build's local HTTP responses passed checks for root Open Graph/Twitter metadata, the root social image asset, and a live public article's title/description/URL/image/type metadata and escaped JSON-LD. Signup/login/write/feedback returned normal HTML with viewport metadata. A nonexistent article returned 404 with human recovery text.

Phase 10 encoded WhatsApp and other social links, copy link/caption, native sharing, and manual-copy fallback remain in place. Browser fixtures checked the WhatsApp link and copy-link action. Actual WhatsApp card caching and native in-app browser/share-sheet behavior are manual checks after deployment; no WhatsApp message was sent. Set `NEXT_PUBLIC_SITE_URL` to the official origin when the custom domain is launched.

## SECURITY

The new feedback table has RLS enabled, no public reads, no direct application inserts/deletes, and active-Admin-only reads/status changes. Submitted identity/status/timestamps cannot be spoofed through the RPC. Stored messages and contact information are rendered as React text. URLs are validated and never fetched. The private helper has an empty search path and explicit execute grants; it does not offer arbitrary SQL or privileged table management.

Avatar writes use the ordinary authenticated server client, user-derived paths, existing ownership checks, and dedicated Storage policies. Service-role credentials are not used for these features. Existing auth, role/suspension, article visibility, SQL constraints, sanitization, redirect, cron, and SSRF regressions passed. No dependencies or cropping libraries were added. The Server Action body limit is 3 MB to accommodate the bounded 2 MB avatar; action-level validators remain stricter.

SQL tests exercised actual Postgres policies in PGlite with isolated Auth/Storage schema fixtures. Native Supabase Storage HTTP MIME/size enforcement and Data API grants still need staging verification.

## BUILD/TESTS

- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- Tests: PASS, 39 passed, zero failed or skipped, including both isolated PostgreSQL policy suites.
- Full test command: `node --experimental-strip-types --test --test-concurrency=1 tests/*.test.mjs`, with `CAMPUS_PGLITE_PATH` pointing to the existing temporary PGlite package outside the repository.
- `npm run build`: PASS.
- `git diff --check`: PASS; new-file trailing whitespace scan also clean.

## KNOWN ISSUES

- Apply the reviewed Phase 11 migration to staging/target before deploying. It expects the Phase 9 schema and a new dedicated avatars bucket; inspect any pre-existing avatars bucket/Storage policies before rollout. Do not make an unrelated existing private bucket public without reviewing its contents.
- Keep `app_private` out of the exposed Data API schemas. Verify the new RPC and table grants in staging.
- Guest quotas are shared. A flood can temporarily exhaust intake; no CAPTCHA or per-IP service was introduced.
- Storage/database replacement is not a single transaction. Cleanup failure may leave a public orphan; errors preserve the old profile image or warn after successful replacement.
- Existing external/media avatar URLs are preserved as data and are not automatically deleted. The shared avatar renderer uses allowed Storage/Unsplash sources and initials for unsupported/failed URLs.
- Cropping is deferred. Actual email delivery, real authenticated submission/publication, native Storage enforcement, and WhatsApp/device testing remain pending.
- Existing Node module-type warnings are non-failing.

## MANUAL TESTING

1. Back up and inspect staging migration history, confirm Phase 9 is present, and apply only the reviewed new Phase 11 migration once. Verify RLS/grants, quota helper, RPC exposure, indexes, and the public dedicated avatars bucket settings.
2. From a guest browser at 320/360/390/430px, visit `/write`, sign up, confirm the email, and test an expired confirmation link plus resend. Check reset-password recovery and redirects using the actual configured site origin.
3. As a new OOU contributor, choose a public username, complete name/bio, select OOU, upload JPEG/PNG/WebP, create a draft, and submit. Check status/history and editor-requested changes through publication.
4. Submit guest feedback with and without optional contact/URL; submit signed-in feedback. Verify Admin sees the stored identity/contact and can change all four statuses. Confirm Contributor/Editor cannot SELECT, update, or insert directly into the feedback table.
5. As Contributor, Editor, and Admin, upload/change their own avatar, verify public author/article/workspace previews and previous-object cleanup. Verify another user's folder upload/delete/overwrite is denied even for Admin, and SVG/GIF/oversized files are rejected. Exercise a failed save/upload and concurrent tabs.
6. Confirm `/admin` real signup/submission lists and unresolved count agree with the database. Test feedback filters/pagination and error/empty states.
7. Test unavailable-school and missing-profile recovery, broken article links, expired sign-in during editing, failed uploads, and clipboard denial. Confirm unsaved writing remains visible.
8. After staging deployment, open root/article links in WhatsApp and its in-app browser. Check previews, mobile layout, and copy/share controls. Repeat email and avatar workflows on actual phones.

## FILES CREATED

- app/admin/feedback/actions.ts
- app/admin/feedback/page.tsx
- app/dashboard/profile/actions.ts
- app/dashboard/profile/avatar-actions.ts
- app/feedback/actions.ts
- app/feedback/page.tsx
- components/Avatar.tsx
- components/ConfirmationResend.tsx
- components/FeedbackForm.tsx
- components/admin/FeedbackStatusForm.tsx
- components/dashboard/AvatarUpload.tsx
- docs/phase11-launch-readiness.md
- lib/avatar-client.ts
- lib/avatar-storage.ts
- lib/avatar.ts
- lib/feedback.ts
- lib/student-errors.ts
- supabase/migrations/20261002102340_phase11_feedback_avatars.sql
- tests/launch-database.test.mjs
- tests/launch-rls.sql
- tests/launch.test.mjs

## FILES MODIFIED

- .gitignore
- app/admin/layout.tsx
- app/admin/page.tsx
- app/author/[username]/page.tsx
- app/blog/[slug]/page.tsx
- app/dashboard/page.tsx
- app/editor/authors/page.tsx
- app/forgot-password/page.tsx
- app/login/page.tsx
- app/reset-password/page.tsx
- app/robots.ts
- app/signup/page.tsx
- app/unauthorized/page.tsx
- app/write/page.tsx
- components/PostForm.tsx
- components/SchoolSelect.tsx
- components/dashboard/DashboardNavigation.tsx
- components/dashboard/DashboardShell.tsx
- components/dashboard/EditArticleForm.tsx
- components/dashboard/NewArticleForm.tsx
- components/dashboard/ProfileForm.tsx
- components/site/BetaNotice.tsx
- components/site/Footer.tsx
- lib/auth.ts
- lib/media.ts
- lib/supabase/middleware.ts
- next.config.js
- tests/middleware.test.mjs
- tests/workspaces.test.mjs

## REFERENCES

Storage design was checked against [Supabase access control](https://supabase.com/docs/guides/storage/security/access-control), [bucket restrictions](https://supabase.com/docs/guides/storage/buckets/creating-buckets), and [object removal](https://supabase.com/docs/reference/javascript/storage-from-remove). Confirmation resend uses the documented [Auth resend API](https://supabase.com/docs/reference/javascript/auth-resend).

## FINAL VERDICT

SAFE FOR HUMAN REVIEW: YES. This is a local review verdict, not a claim that the new schema/features have been deployed or live student testing completed.
