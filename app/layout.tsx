import type { Metadata } from 'next';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import { createClient } from '@/lib/supabase/server';
import './globals.css';

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || 'https://the-dailybyte-nine.vercel.app'
);
const defaultSocialImage = {
  url: new URL('/brand/the-daily-byte-og.png', metadataBase).toString(),
  width: 1731,
  height: 909,
  alt: 'The Daily Byte — news, tech, and culture',
};

export const metadata: Metadata = {
  applicationName: 'The Daily Byte',
  metadataBase,
  title: {
    default: 'The Daily Byte — News, Tech & Entertainment',
    template: '%s | The Daily Byte',
  },
  description: 'News, tech, and entertainment — updated daily.',
  openGraph: {
    siteName: 'The Daily Byte',
    type: 'website',
    images: [defaultSocialImage],
  },
  twitter: {
    card: 'summary_large_image',
    images: [defaultSocialImage],
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
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-ink">Skip to content</a>
        <Header categories={categories ?? []} hasBreaking={(breakingCount ?? 0) > 0} />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 scroll-mt-40">{children}</main>
        <Footer categories={categories ?? []} />
      </body>
    </html>
  );
}
