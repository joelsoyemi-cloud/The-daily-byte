# The Daily Byte identity

The selected fourth branding concept is the visual reference: editorial off-white,
a large wordmark with Byte in brand red, subtle newsroom geometry and city collage.
The selected wide artwork belongs in social previews and larger publication visuals,
not the Header or favicon. Its intended asset path is
`public/brand/the-daily-byte-og.png`. Do not substitute another generated concept.

## Components

`BrandLogo` uses a dedicated editorial serif stack: Georgia, Times New Roman, serif.
Georgia bold was visually compared with the hero video's first frame; its broad
letterforms, serif shapes, and proportions are the closest web-safe match. The
wordmark uses 700 weight and -0.045em tracking. No font download or dependency is
required. Archivo remains the display font for headings, rather than the wordmark.
It intentionally does not pretend to be a portable, font-independent SVG wordmark.
Set size with `className`, for example `text-2xl sm:text-3xl`.

- `variant="light"` (default): ink lettering and red Byte, on light surfaces.
- `variant="dark"`: white lettering and red Byte, on dark surfaces.
- `variant="mono"`: the entire wordmark inherits `currentColor`; set `text-ink`
  or `text-white` on the surrounding element for monochrome use.

Use this wordmark for the Header, Footer, auth-page identity, workspace navigation,
search identity, campus introduction, and article newsletter identity. Narrative
mentions of the publication keep ordinary typography. Keep its font, weight and
tracking in the reusable component; wrapper links should only set size/layout.

`BrandMark` uses the same variants. It is a geometric DB with a detached red pixel,
drawn as paths so it remains independent of fonts. Use it at 16px and above.
It defaults to a labeled image. Pass `decorative` when adjacent text already
supplies the same accessible name. Both components are static and require no hooks.

Wrap a wordmark in a homepage link where navigation is appropriate. The component
provides one accessible name; avoid duplicating it with hidden text or SVG titles.
Do not add looping animation. Preserve the existing Header's reduced-motion behavior.

## Icon assets

- `public/brand/logo-mark.svg`: 512px square public publisher/logo asset.
- `app/icon.svg`: native App Router browser icon, using the same path geometry.
- `app/apple-icon.png`: 180px PNG derivative for Apple touch icons.

Keep the two SVG geometries and the BrandMark paths synchronized when changing the
mark. Regenerate the PNG from the public SVG using the existing local Sharp tool:

```sh
node -e "require('sharp')('public/brand/logo-mark.svg').resize(180,180).png().toFile('app/apple-icon.png')"
```

The icon includes a white plate for legibility on both light and dark browser chrome.
The React mark is transparent so its surface variant can be selected explicitly.

## Boundaries

Keep Georgia for the wordmark, Archivo/Inter for the rest of the site, and the
configured ink, red, gold, teal, paper, surface and line
palette. Off-white collage treatment belongs to the approved artwork; do not
recolor the application's paper background or redesign existing page layouts.
Article cover images must take precedence over the default branded social card.
