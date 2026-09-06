import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://the-dailybyte-nine.vercel.app",
  ),
  title: {
    default: "The Daily Byte — News, Tech & Entertainment",
    template: "%s | The Daily Byte",
  },
  description: "News, tech, and entertainment — updated daily.",
  openGraph: {
    siteName: "The Daily Byte",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <div className="bg-ink text-white/70 text-xs font-medium">
          <div className="max-w-6xl mx-auto px-5 py-1.5 flex justify-between">
            <span>Updated daily</span>
            <Link href="/admin" className="hover:text-white">
              Admin
            </Link>
          </div>
        </div>

        <header className="border-b-2 border-ink">
          <div className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
            <Link href="/" className="font-display font-900 text-3xl tracking-tight">
              The Daily<span className="text-brand">Byte</span>
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-line mt-20 bg-surface">
          <div className="max-w-6xl mx-auto px-5 py-10 text-sm text-muted flex items-center justify-between">
            <span>&copy; {new Date().getFullYear()} The Daily Byte</span>
            <Link href="/admin" className="hover:text-brand">
              Admin login
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
