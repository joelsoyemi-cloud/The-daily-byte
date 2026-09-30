import type { Metadata } from 'next';
import Header from '@/components/site/Header';
import { createClient } from '@/lib/supabase/server';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://the-dailybyte-nine.vercel.app'
  ),
  title: {
    default: 'The Daily Byte — News, Tech & Entertainment',
    template: '%s | The Daily Byte',
  },
  description: 'News, tech, and entertainment — updated daily.',
  openGraph: {
    siteName: 'The Daily Byte',
    type: 'website',
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
        <Header categories={categories ?? []} hasBreaking={(breakingCount ?? 0) > 0} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line mt-20 bg-surface py-10">
          <div className="max-w-6xl mx-auto px-5 text-sm text-muted flex items-center justify-between">
            <span>&copy; {new Date().getFullYear()} The Daily Byte</span>
          </div>
        </footer>
      </body>
    </html>
  );
}