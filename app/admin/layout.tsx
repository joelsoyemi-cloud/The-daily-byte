import Link from 'next/link';
import SignOutButton from './SignOutButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b-2 border-ink bg-white">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/admin" className="font-display font-900 text-lg">
            Admin
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-muted">
            <Link href="/" className="hover:text-brand">
              View site
            </Link>
            <SignOutButton />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
