# Phase 10: Contributor onboarding and campus growth

## PHASE 10 STATUS

Implementation and local audit complete. SAFE FOR HUMAN REVIEW: YES.
No commit, push, deployment, production database write, real signup, or external message was performed.

Final verification:

- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.
- Tests: 27 PASS, zero failed/skipped. Ran `node --experimental-strip-types --test --test-concurrency=1 tests/*.test.mjs` with `CAMPUS_PGLITE_PATH` pointing to the existing temporary PGlite installation. This includes isolated PostgreSQL migration, constraints, and RLS checks.
- `git diff --check`: PASS.
- Isolated browser fixtures: PASS for seven views at nine widths, signup confirmation/immediate-session branches, caption copying, clipboard failure fallback, and social-link attributes.

## ONBOARDING

Public desktop/mobile Write for us and the footer lead to `/write`. The signup CTA leads to `/signup`; the existing-contributor CTA leads to `/dashboard/articles/new`. Anonymous access to protected pages redirects through login with the requested path preserved by existing middleware.

Signup collects name/email/password only, sends no role choice, and handles errors and network exceptions. A confirmation-required response shows check-email instructions and a sign-in link; an immediate session navigates to Writing. The checked-in database trigger assigns contributor/active rather than trusting user metadata for role selection. Login and middleware continue to enforce database-backed role/status checks.

Writing now explains profile setup, optional school affiliation, drafting, and editorial submission. Existing draft, submission, change-request, and publishing transitions remain unchanged. Signup response branches were browser-tested with isolated fake responses; actual email delivery and real signup-to-publication remain staging checks.

## WRITE PAGE

`/write` explains who can contribute, topics/formats, the editorial process, bylines/portfolio value, voluntary unpaid contributions, and publication expectations. It does not promise acceptance or automatic publishing.

`/write?school=<slug>` reads an active campus and offers profile setup guidance. Malformed, repeated, unknown, or inactive school parameters do not assign affiliations or permissions. Affiliation is selected explicitly in the profile/story forms; campus context is not automatically carried into signup.

## BETA/TESTING UX

The reusable Early access notice appears on `/write`, signup, Writing overview, and the public footer. It explicitly describes student testing before official launch. Campus copy describes an independent community initiative and does not claim university endorsement, partnership, or verification.

## FEEDBACK

General product feedback and abuse/article reporting are intentionally deferred, known non-blocking Phase 10 items. No feedback form, reporting endpoint, inbox, persistence, moderation queue, or delivery integration was added. The broken `/feedback` link was removed. Existing editor review feedback remains available to writers and is distinct from public reporting.

## SOCIAL SHARING

Public articles use WhatsApp, X, Facebook, and LinkedIn links with encoded title/URL parameters, `noopener noreferrer`, and accessible new-tab descriptions. Copy link, copy caption, optional native sharing, cancellation handling, status announcements, and manual textarea fallback are implemented. Captions normalize whitespace and bound title/excerpt lengths. Sharing uses canonical public article URLs and does not automatically post to any platform.

Browser checks verified caption copy, manual fallback when clipboard access fails, and all four external link attributes. Native share sheets and external platform previews were not exercised on actual mobile devices/platform accounts.

## CONTRIBUTOR SHARING

Published stories in Writing lists expose Share story, linking to the authenticated owner's story view. That view checks contributor access and ownership before rendering sharing controls. Only `published` stories expose these controls; drafts, submissions, rejected/archived stories, and scheduled stories do not. Due scheduled articles remain publicly readable under the existing public visibility contract, but the private sharing panel waits for published status.

## CAMPUS GROWTH

The directory has a Become a contributor CTA. Active campus pages have a Write about this campus CTA linking to `/write?school=<slug>`. School-specific onboarding offers the profile setup path. The existing OOU discovery link remains on `/write`; school selection is optional and never changes authorization or publication workflow.

## SEO

`/write` uses the established metadata helper: title, description, absolute canonical `/write`, Open Graph, Twitter card, branded fallback image, and RSS alternate. Campus-specific query variants consolidate to `/write`. The sitemap includes `/write` and its capacity accounting was updated. Existing article/author/campus metadata and escaped structured data remain in place. Signup/workspaces remain excluded from indexing through existing metadata/robots settings.

## RESPONSIVE

Real-component isolated fixtures checked `/write` with OOU context, signup, campus directory, OOU campus, Writing overview, My stories, and sharing controls at 320, 360, 390, 430, 768, 1024, 1280, 1440, and 1920 pixels. No horizontal overflow was observed. The `/write` 390px screenshot was visually reviewed. These checks used mock data/auth and do not constitute live authenticated end-to-end testing or whole-site device certification.

## ACCESSIBILITY

The write page has one H1, section headings, a semantic process list, descriptive links, flexible layouts, and 44px minimum CTA targets. Signup inputs have associated labels/autocomplete, 44px minimum input/button targets, error alerts, and busy state. Sharing has button semantics, explicit accessible group/new-tab labels, a live status region, focus outlines, and a labelled selectable manual-copy field. Existing global focus, reduced-motion, skip-link, and mobile dialog behavior remains intact. No full assistive-technology or automated WCAG certification was performed.

## SECURITY

No new dependency, service-role client, secret, API endpoint, schema migration, or authorization override was introduced. Signup uses the existing public client and fixed-role database trigger. Server guards and RLS retain ownership/role/status boundaries. Public article visibility continues to exclude drafts and future scheduled content. Sharing passes plain text and encoded URLs; React text escaping and Markdown/JSON-LD sanitization remain intact. Existing redirect, SSRF, cron, XSS, role, suspension, and isolated database tests passed.

Signup session behavior was checked against [Supabase signUp documentation](https://supabase.com/docs/reference/javascript/auth-signup). Platform configuration was not changed or live-audited.

## KNOWN ISSUES

- Target-database migration 0003 remains a prerequisite from Phase 9; no rollout was performed. Confirm the target already has it before deploying.
- Verify signup enablement, confirmation emails, redirect allowlist, and contributor profile creation in staging.
- Native mobile share sheets, platform previews, real device/assistive-technology testing, and authenticated signup-to-publication remain external verification items.
- School context is advisory and selected manually after signup.
- Existing Node module-type warnings are non-failing.
- A pre-existing edit to `docs/phase8-newsroom.md` was preserved.

## UNFINISHED ITEMS

No blocking Phase 10 implementation item remains. Feedback/reporting is intentionally deferred. Deployment and the listed staging checks have not been performed.

## FINAL VERDICT

SAFE FOR HUMAN REVIEW: YES. This is a local implementation/review verdict, not confirmation of production rollout or live operational readiness.
