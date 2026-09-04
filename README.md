# The Daily Byte — your blog

Next.js 14 + Supabase. You log in at `/admin`, write a post in Markdown, hit
Publish, and it's live at `/blog/your-slug` immediately. Drafts stay hidden
from the public site until you publish them.

## 1. Create your Supabase project

1. Go to supabase.com → New project. Pick any name/region, set a database password (save it somewhere).
2. In your new project, open **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it. This creates the `posts` table and locks it down with row-level security (public can only read published posts; only logged-in you can write).
3. Go to **Authentication → Users → Add user**, create yourself an account with your email + a password. This is how you'll log into `/admin` — there's no public sign-up, only you have access.
4. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key.

## 3. Set up media storage (for image/video uploads)

1. Same as above — **SQL Editor → New query**, paste the contents of
   `supabase/storage.sql`, run it. This creates a public "media" bucket and
   locks uploads to your account only.

## 4. Configure the project locally

```bash
cp .env.local.example .env.local
```

Paste your Project URL and anon key into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

Then install and run:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` for the public site, and
`http://localhost:3000/admin` to log in and write your first post.

## 3. Deploy it (Vercel — free)

1. Push this folder to a GitHub repo.
2. Go to vercel.com → New Project → import the repo.
3. In the project's Environment Variables, add the same two variables from
   `.env.local`.
4. Deploy. You'll get a live URL (e.g. `build-notes.vercel.app`), which you
   can later point a custom domain at from Vercel's project settings.

Every time you push to `main`, Vercel redeploys automatically. Publishing a
post, though, doesn't need a redeploy at all — it writes straight to
Supabase and shows up instantly.

## How it works

- **Public site** (`/`, `/blog/[slug]`) — reads only `published = true`
  posts directly from Supabase on each request.
- **Admin** (`/admin`) — protected by middleware; if you're not logged in,
  you're bounced to `/admin/login`. Once in, you get a dashboard listing
  every post (draft and published), a "New post" editor with a live Markdown
  preview, and edit/delete on each post.
- **Auth** — Supabase Auth with email/password. Only accounts you create
  manually in the Supabase dashboard can log in — there's no public
  registration, so nobody but you can post.
- **Content** — stored as Markdown in Postgres. Code blocks, tables, links,
  and images all render with syntax highlighting on the public page.

## Media (images & video)

- **Cover image** — paste a URL, or hit **Upload** to send a file straight
  from your device. Uploads go to Supabase Storage automatically.
- **Images in the body** — hit **+ Image(s)** in the content toolbar to add
  one or several at once; each is compressed in your browser before upload
  (resized to a max width, re-encoded as JPEG) so they stay light, then
  inserted as Markdown at your cursor.
- **Video by URL** — hit **+ Video URL** and paste a YouTube or Vimeo link;
  it embeds as a responsive player.
- **Video upload** — hit **+ Video file** to upload your own video file
  directly; it embeds with native browser controls.
- All uploaded media is public once live (needed so it displays on your
  blog), but only you can upload, replace, or delete files.

## Extending it later

- **Custom domain** — add it in Vercel's project settings, point your DNS,
  done.
- **Newsletter** — add a ConvertKit/Buttondown embed to the footer or a post
  page; no backend change needed.
- **Images** — uploads are wired in with automatic compression (see Media
  section above).
- **RSS feed** — a `/feed.xml` route can be generated from the same posts
  table in a few lines if you want one.
