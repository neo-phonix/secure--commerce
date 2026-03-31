import { createClient } from '@/lib/supabase/server';

export type UserRole = 'user' | 'admin' | 'super_admin';

export async function getUserRole(): Promise<UserRole> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 'user';

  // Fetch role from profiles table for trusted server-side source
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  const role = profile?.role || 'user';
  
  return role as UserRole;
}

export async function hasRole(allowedRoles: UserRole[]): Promise<boolean> {
  const role = await getUserRole();
  return allowedRoles.includes(role);
}

export async function isAdmin(): Promise<boolean> {
  return await hasRole(['admin', 'super_admin']);
}
