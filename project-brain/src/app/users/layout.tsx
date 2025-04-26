import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { hasPermission } from '@/lib/auth';
import { Database } from '@/types/supabase';

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If there's no session, redirect to login
  if (!session) {
    redirect('/login?redirectedFrom=/users');
  }
  
  // Get the user's role from the database
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  // If we can't fetch the role, redirect to login
  if (error || !userData) {
    redirect('/login?error=profile');
  }
  
  // Check if the user has permission to view users
  const hasViewUsersPermission = hasPermission(userData.role, 'view:users');
  
  // If not, redirect to unauthorized page
  if (!hasViewUsersPermission) {
    redirect('/unauthorized');
  }
  
  // If all checks pass, render the children
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 