import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Role = 'reader' | 'contributor' | 'author' | 'editor' | 'admin';

export type Profile = {
  id: string;
  username: string | null;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  role: Role;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  updated_at: string;
};

const EDITOR_ROLES: Role[] = ['editor', 'admin'];
const AUTHOR_ROLES: Role[] = ['contributor', 'author', 'editor', 'admin'];

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (profile as Profile) ?? null;
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.status !== 'active') redirect('/unauthorized?reason=suspended');
  return profile;
}

export async function requireRole(roles: Role[]): Promise<Profile> {
  const profile = await requireAuth();
  if (!roles.includes(profile.role)) {
    redirect('/unauthorized');
  }
  return profile;
}

export async function requireContributor(): Promise<Profile> {
  return requireRole(AUTHOR_ROLES);
}

export async function requireEditor(): Promise<Profile> {
  return requireRole(EDITOR_ROLES);
}

export async function requireAdmin(): Promise<Profile> {
  return requireRole(['admin']);
}

export function isEditorOrAdmin(role: Role): boolean {
  return EDITOR_ROLES.includes(role);
}