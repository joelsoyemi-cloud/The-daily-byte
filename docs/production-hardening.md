# Phase 7 production hardening

The implementation preserves Next.js 15, React 19, Supabase, the posts table, roles, editorial transitions, publication predicate, branding, and Markdown sanitizer stack. No database or RLS changes were applied.

## Verification

Run `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`, and `git diff --check`. The regression suite uses Node's native TypeScript stripping (Node 22.6+; tested with Node 24). Its harmless module-type detection warning does not affect the application build.

Regression coverage includes adjacent forbidden embeds, scripts/events/unsafe URLs, allowed media, redirect validation, trusted source URLs, RSS escaping, media limits, archive canonicals, role/suspension checks, recovery sessions, cookie chunks, cron missing-secret behavior, and draft API authorization/errors. Tests use mocks for authenticated/provider operations and do not write production data or send emails.

## Security fixes

- Removing a forbidden embed previously skipped the next sibling. Returning the removed index fixes traversal; sanitizer schema, plugin order and allowed hosts remain unchanged.
- Login destinations accept only local paths. Middleware preserves all refreshed cookie chunks and exchanges existing login/reset PKCE links. Recovery sessions can reach the reset form.
- A missing CRON_SECRET now fails closed. The publishing RPC and cron schedule are unchanged.
- Draft generation requires an active contributor/author/editor/admin. Source fetches accept only the existing Google News article provider, with redirects disabled. Provider/database errors are not returned to readers.
- Secret-bearing modules have server-only guards. Environment files and generated TypeScript build info are ignored.
- Safe response headers are configured. A strict CSP is deliberately deferred until Supabase, framework scripts, images and YouTube/Vimeo embeds can be tested with a report-only policy.

## Deployment configuration

Keep NEXT_PUBLIC_SITE_URL set to the canonical production origin, and configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET and provider credentials must remain server-only. No environment values were changed.

The image optimizer accepts the configured Supabase public-storage host and images.unsplash.com. If editors use another trusted image provider, explicitly add its hostname to the server-side IMAGE_HOSTS comma-separated variable and rebuild. Do not add wildcard hosts.

The RSS feed is /rss.xml, limited to 50 visible stories with narrow fields and no full body. Feed and sitemap use cookie-free anonymous clients and fresh visibility predicates. Sitemap requests fetch batches of 500 with a total 50,000-URL guard. Split into sitemap files before reaching that limit.

## Operational checks requiring project/account access

- Validate live Supabase RLS with anonymous, reader, contributor, editor, admin and suspended accounts. Historical SQL in the repository is not proof of current deployed policies. In particular, confirm public reads support published OR scheduled_at <= now for scheduled rows, while private statuses and future schedules remain inaccessible.
- Confirm live Storage policies enforce ownership/roles and server-side MIME/size restrictions. Browser checks reject active document formats and bound uploads (20 MB images, 50 MB videos), but are not an authorization boundary and can be bypassed by direct requests.
- Complete email confirmation/password recovery in the same browser, including expired/reused links. Existing /login and /reset-password redirect destinations are unchanged; verify their Supabase allowlist entries.
- Smoke-test real role accounts, editorial saves, authorized uploads and draft generation. Restricted source redirects can reduce source context; the existing draft fallback remains available.
- Confirm the deployed cron and CRON_SECRET in Vercel. No tracked cron configuration exists in this repository; do not assume local parent-directory configuration is deployed.
- Verify Vercel's connected Git repository and production branch. A push triggers deployment only when the integration and branch settings enable it.
- Check RSS/sitemap and social previews on the actual public hostname after deployment. A populated author archive and future/due scheduled fixtures require existing suitable production/staging data.

## Verified local results

- TypeScript, lint and production build passed; 17 regression tests passed. Full npm audit: zero reported vulnerabilities.
- Representative public/auth routes passed. Missing article/category/author routes returned 404; anonymous dashboard/editor/admin requests redirected to login. Unauthenticated generation and cron calls returned 401.
- RSS currently contained 8 stories; sitemap contained 19 URLs. Canonicals, pagination metadata, social fallback and article-cover precedence passed rendered-output checks.
- Current anonymous database queries returned zero private-status and future-scheduled rows, without errors. This is a snapshot check, not a substitute for the full role/policy matrix.
- Browser checks covered 320, 360, 390, 430, 768, 1024, 1280, 1440 and 1920 px across home, article, two category archives, opinions, videos, missing-author and auth pages. No horizontal overflow or runtime exceptions were observed. No populated author username was available for a positive author fixture.
- Menu focus containment/restoration, Escape, desktop resize, search results, reduced motion, reading progress, copy link and recommendation deduplication passed.
- Client bundle scan found none of the five configured server secret values. SQL, role model, editorial transitions, Markdown schema and plugin order were unchanged.
- The OG image shrank from 1,681,975 to 1,586,559 bytes (5.7%); decoded pixel buffers were identical. Dimensions and artwork are unchanged.
- Existing generated tsconfig.tsbuildinfo is removed from version control; future local copies are ignored. No broad dead-code cleanup or new loading screens were introduced.

## Files created

| Path | Purpose |
| --- | --- |
| app/error.tsx | Generic accessible error/recovery state. |
| app/forgot-password/layout.tsx | Private/auth noindex metadata. |
| app/login/layout.tsx | Private/auth noindex metadata. |
| app/not-found.tsx | Generic accessible error/recovery state. |
| app/reset-password/layout.tsx | Private/auth noindex metadata. |
| app/rss.xml/route.ts | Bounded public RSS feed with XML escaping. |
| app/signup/layout.tsx | Private/auth noindex metadata. |
| app/unauthorized/layout.tsx | Private/auth noindex metadata. |
| docs/production-hardening.md | Verification record, configuration and operational checklist. |
| eslint.config.mjs | Reproducible lint/test tooling, server-only guard and patched PostCSS dependency. |
| lib/media-validation.ts | Upload MIME and size checks. |
| lib/rss.ts | Bounded public RSS feed with XML escaping. |
| lib/safe-redirect.ts | Local-only login redirect validation. |
| lib/site.ts | Canonical site URLs and default social metadata. |
| lib/source-url.ts | Trusted headline-source URL validation. |
| lib/supabase/public.ts | Cookie-free anonymous discovery-document client. |
| tests/api-security.test.mjs | Security/auth/metadata regression coverage. |
| tests/hardening.test.mjs | Security/auth/metadata regression coverage. |
| tests/middleware.test.mjs | Security/auth/metadata regression coverage. |
| tests/security.test.mjs | Security/auth/metadata regression coverage. |

## Files modified

| Path | Purpose |
| --- | --- |
| .gitignore | Ignore environment files and generated TypeScript build info. |
| app/admin/advertising/page.tsx | Escape static JSX punctuation for lint; rendered text and behavior unchanged. |
| app/admin/layout.tsx | Private/auth noindex metadata. |
| app/admin/roles/page.tsx | Escape static JSX punctuation for lint; rendered text and behavior unchanged. |
| app/api/cron/publish-scheduled/route.ts | Fail-closed missing-secret guard and generic errors. |
| app/api/generate-draft/route.ts | Active-role authorization, request validation and generic errors. |
| app/author/[username]/page.tsx | Pagination-aware canonical and consistent social metadata. |
| app/blog/[slug]/page.tsx | Social fallback, feed alternate, article error handling and escaped BreadcrumbList/author URL. |
| app/dashboard/headlines/page.tsx | Escape static JSX punctuation for lint; rendered text and behavior unchanged. |
| app/dashboard/layout.tsx | Private/auth noindex metadata. |
| app/dashboard/page.tsx | Escape static JSX punctuation for lint; rendered text and behavior unchanged. |
| app/editor/activity/page.tsx | Escape static JSX punctuation for lint; rendered text and behavior unchanged. |
| app/editor/layout.tsx | Private/auth noindex metadata. |
| app/forgot-password/page.tsx | Form accessibility and safe auth/recovery edge cases. |
| app/layout.tsx | Shared metadata, site OpenGraph URL, Organization and WebSite schemas. |
| app/login/page.tsx | Form accessibility and safe auth/recovery edge cases. |
| app/opinions/page.tsx | Pagination-aware canonical and consistent social metadata. |
| app/page.tsx | Home canonical/feed alternate and generic data-error handling. |
| app/reset-password/page.tsx | Form accessibility and safe auth/recovery edge cases. |
| app/robots.ts | Exclude private/auth routes and reference canonical sitemap. |
| app/section/[slug]/page.tsx | Pagination-aware canonical and consistent social metadata. |
| app/signup/page.tsx | Form accessibility and safe auth/recovery edge cases. |
| app/sitemap.ts | Anonymous, fresh, bounded public discovery queries. |
| app/videos/page.tsx | Pagination-aware canonical and consistent social metadata. |
| components/admin/UsersTable.tsx | Escape static JSX punctuation for lint; rendered text and behavior unchanged. |
| components/editor/EditorArticleForm.tsx | Escape static JSX punctuation for lint; rendered text and behavior unchanged. |
| components/editor/MediaLibrary.tsx | Stable effect callback and dependencies. |
| components/site/BreakingTicker.tsx | Encode article slugs in existing links. |
| components/site/BreakingTickerTrack.tsx | Encode article slugs in existing links. |
| components/site/Hero.tsx | Encode article slugs in existing links. |
| components/site/SearchOverlay.tsx | Encode article slugs in existing links. |
| components/site/StoryCard.tsx | Encode article slugs in existing links. |
| components/site/sections/TypographyList.tsx | Encode article slugs in existing links. |
| lib/ai.ts | Server-only guard and SSRF-resistant source fetch. |
| lib/auth.ts | Request-scoped profile deduplication and narrow fields. |
| lib/media-search.ts | Server-only import guard. |
| lib/media.ts | Bounded raster processing, bitmap cleanup, unique uploads and escaped video markup. |
| lib/public-listings.ts | Reuse canonical URL helper; query behavior unchanged. |
| lib/rehype-restrict-embeds.ts | Fix adjacent forbidden embed traversal without changing sanitizer strategy. |
| lib/supabase/middleware.ts | Cookie propagation, recovery exchange and safe role redirects. |
| lib/supabase/server.ts | Typed cookie bulk read/write support. |
| lib/supabase/service.ts | Server-only import guard. |
| next.config.js | Safe headers, explicit image hosts and stable build tracing root. |
| package-lock.json | Reproducible lint/test tooling, server-only guard and patched PostCSS dependency. |
| package.json | Reproducible lint/test tooling, server-only guard and patched PostCSS dependency. |
| public/brand/the-daily-byte-og.png | Lossless compression, identical decoded pixels. |
