import PublicChrome from '@/components/site/PublicChrome';
import type { Metadata } from 'next';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import { createClient } from '@/lib/supabase/server';
import './globals.css';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, DEFAULT_SOCIAL_IMAGE, feedAlternate, siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  applicationName: 'The Daily Byte',
  metadataBase: SITE_URL,
  title: {
    default: 'The Daily Byte — News, Tech & Entertainment',
    template: '%s | The Daily Byte',
  },
  description: SITE_DESCRIPTION,
  alternates: { types: feedAlternate },
  openGraph: {
    siteName: 'The Daily Byte',
    url: siteUrl('/'),
    type: 'website',
    title: 'The Daily Byte — News, Tech & Entertainment',
    description: SITE_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('name, slug')
    .order('name');

  const { count: breakingCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('breaking', true)
    .or(`status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${new Date().toISOString()})`);

  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen flex flex-col bg-paper text-ink">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@graph': [
            { '@type': 'Organization', '@id': siteUrl('/#organization'), name: SITE_NAME, url: siteUrl('/'), logo: { '@type': 'ImageObject', url: siteUrl('/brand/logo-mark.svg'), width: 512, height: 512 } },
            { '@type': 'WebSite', '@id': siteUrl('/#website'), name: SITE_NAME, url: siteUrl('/'), publisher: { '@id': siteUrl('/#organization') } },
          ],
        }).replace(/</g, '\\u003c') }} />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-ink">Skip to content</a>
        <PublicChrome><Header categories={categories ?? []} hasBreaking={(breakingCount ?? 0) > 0} /></PublicChrome>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 scroll-mt-40">{children}</main>
        <PublicChrome><Footer categories={categories ?? []} /></PublicChrome>
      </body>
    </html>
  );
}
