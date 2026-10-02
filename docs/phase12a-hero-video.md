# Phase 12A — Hero video integration

## HERO VIDEO

The supplied video is copied unchanged to `public/media/daily-byte-hero.mp4`. Original and copy SHA-256: `D17566683DD531E29FDF1EEBF6BABE418F77AAD1066EEB463B32986EBEB76C60`. Size: 3,695,689 bytes; dimensions: 1280×720; duration: approximately 10 seconds. No regeneration, editing, transcoding, or replacement was performed.

The homepage reuses the existing Hero component. The video introduction sits above the existing top-stories grid; story queries, visibility rules, category sections, navigation, branding, metadata, and structured data remain intact. The video autoplays muted, loops, plays inline, and has no native controls.

## FALLBACK

The existing `/brand/the-daily-byte-og.png` is the poster and persistent static fallback. Video sources are mounted only after the browser confirms that reduced motion is not requested. Reduced-motion visitors make no hero-video request. Preference changes are handled at runtime. Media errors or rejected playback restore the static image. The server-rendered poster, HTML copy, and links work without JavaScript.

## COPY/CTA

- H1: “Stories worth reading. Voices worth publishing.”
- Supporting copy: “News, tech, culture and student stories — all in one place.”
- Explore Stories: `#stories`, the existing homepage story grid.
- Write for The Daily Byte: `/write`.

There is one homepage H1. Text is real server-rendered HTML. Existing metadata and structured data were not removed.

## RESPONSIVE

Browser checks passed at 320, 360, 390, 430, 768, 1024, 1280, 1440, and 1920 pixels. No page horizontal overflow was observed; headings fit and both CTAs have at least 48px height. Mobile buttons stack, while wider layouts use a horizontal row. Object-fit cover uses left alignment on phones and top alignment on desktop to preserve the asset's upper-left branding. Mobile and desktop screenshots were visually reviewed.

## ACCESSIBILITY

Decorative media is hidden from assistive technology and is not keyboard focusable. Headline, supporting text, and links remain readable over a dark gradient if media fails. White text and the existing brand-red CTA use contrasting backgrounds; keyboard Tab navigation confirmed a visible focus outline. A separate, labelled pause/play button lets visitors stop the continuous motion without enabling native video controls. Reduced-motion mode displays only the poster. Browser checks passed for pause/resume, keyboard focus, initial/runtime reduced-motion handling, media-error fallback, and the no-JavaScript static hero.

## PERFORMANCE

No dependencies were added. The video uses `preload="none"`, with no video preload link or duplicate media source. Autoplay still downloads the supplied approximately 3.7 MB file when motion is allowed. The static poster is requested with high priority. The now-below-hero lead-story image no longer requests priority loading. Media is absolutely positioned within a minimum-height hero, and the measured hero height remained unchanged when switching to the poster.

## FILES MODIFIED

- `app/page.tsx`: removes the previous hidden H1 in favour of the real hero headline.
- `components/site/Hero.tsx`: integrates the video/copy/CTAs, retains the story grid, and exposes its anchor.

Created:

- `components/site/HeroVideo.tsx`: media preference, fallback, and playback control.
- `public/media/daily-byte-hero.mp4`: exact supplied asset.
- `docs/phase12a-hero-video.md`: this report.

## BUILD/TESTS

- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.
- Tests: 39 passed, zero failed or skipped, including both isolated PostgreSQL policy suites. Command: `node --experimental-strip-types --test --test-concurrency=1 tests/*.test.mjs`, with the existing temporary PGlite package configured through `CAMPUS_PGLITE_PATH`.
- `git diff --check`: PASS.
- Browser checks used the local application and read-only public story data. No accounts, email messages, database records, or Storage objects were created.
- Production HTTP checks passed for the homepage H1, existing Open Graph metadata and JSON-LD, CTA/poster output, video MIME type, exact served SHA-256, and HTTP 206 byte-range delivery.

## KNOWN ISSUES

Physical iOS/Android and in-app browser playback remain manual checks. Browser autoplay restrictions intentionally produce the static fallback. The asset's baked-in design/text is retained exactly as supplied; its decorative navigation is not interactive. The unmodified 1280×720 source can appear softer on very wide displays. No alternate codec, compression, or mobile asset was created because the supplied video must remain unchanged. Existing non-failing Node module-type and Git line-ending warnings remain.

## FINAL VERDICT

SAFE FOR HUMAN REVIEW: YES. No commit, push, or deployment was performed.
