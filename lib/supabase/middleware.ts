import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_PAGES = ['/login', '/signup', '/forgot-password'];
const PROTECTED_PREFIXES = [
  { prefix: '/admin', roles: ['admin'] },
  { prefix: '/editor', roles: ['editor', 'admin'] },
  { prefix: '/dashboard', roles: ['contributor', 'author', 'editor', 'admin'] },
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const path = request.nextUrl.pathname;
  const match = PROTECTED_PREFIXES.find(({ prefix }) => path === prefix || path.startsWith(prefix + '/'));
  const redirectTo = (path: string, next?: string) => {
    const url = new URL(path, request.url);
    if (next) url.searchParams.set('next', next);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  };
  const code = request.nextUrl.searchParams.get('code');
  if (code && ['/login', '/reset-password'].includes(path)) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return redirectTo(error ? '/login?error=invalid-link' : path);
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (match && !user) return redirectTo('/login', path + request.nextUrl.search);
  // Password recovery must remain reachable with a recovery session.
  if (user && (match || AUTH_PAGES.includes(path))) {
    const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single();
    if (!profile || profile.status !== 'active' || (match && !match.roles.includes(profile.role))) {
      return redirectTo('/unauthorized');
    }
    if (AUTH_PAGES.includes(path)) {
      return redirectTo(profile.role === 'admin' ? '/admin' : profile.role === 'editor' ? '/editor' : ['contributor', 'author'].includes(profile.role) ? '/dashboard' : '/');
    }
  }
  return response;
}
