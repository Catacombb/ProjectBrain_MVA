'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { hasPermission } from '../auth';
import { Database } from '@/types/supabase';

type UserRole = 'admin' | 'director' | 'team' | 'client' | 'builder';

export async function getCurrentUserPermissions() {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { 
      permissions: [],
      error: 'Not authenticated' 
    };
  }
  
  // Get user's role from the database
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (error || !userData) {
    return { 
      permissions: [],
      error: 'Failed to fetch user role' 
    };
  }
  
  // Call the edge function to get all permissions
  const { data: permissionsData, error: permissionsError } = await supabase.functions.invoke('get-user-permissions', {
    body: { userRole: userData.role }
  });
  
  if (permissionsError) {
    return { 
      permissions: [],
      error: 'Failed to fetch permissions' 
    };
  }
  
  return { 
    permissions: permissionsData.permissions,
    error: null 
  };
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Get current user's role from the database
  const { data: currentUserData, error: currentUserError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (currentUserError || !currentUserData) {
    return { success: false, error: 'Failed to fetch user role' };
  }
  
  // Check if current user has permission to manage roles
  const hasManageRolesPermission = await hasPermission(currentUserData.role, 'manage:roles');
  
  if (!hasManageRolesPermission) {
    // Log unauthorized role change attempt
    await supabase.rpc('log_auth_event', {
      user_id: session.user.id,
      event_type: 'unauthorized_role_change',
      event_details: JSON.stringify({
        target_user_id: userId,
        attempted_role: newRole,
        current_user_role: currentUserData.role
      })
    });
    
    return { success: false, error: 'Insufficient permissions to manage roles' };
  }
  
  // Perform the role update
  const { error: updateError } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);
  
  if (updateError) {
    return { success: false, error: updateError.message };
  }
  
  // Log successful role change
  await supabase.rpc('log_auth_event', {
    user_id: session.user.id,
    event_type: 'role_change',
    event_details: JSON.stringify({
      target_user_id: userId,
      new_role: newRole
    })
  });
  
  return { success: true, error: null };
}

export async function getUsersWithRoles() {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { users: [], error: 'Not authenticated' };
  }
  
  // Get current user's role from the database
  const { data: currentUserData, error: currentUserError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (currentUserError || !currentUserData) {
    return { users: [], error: 'Failed to fetch user role' };
  }
  
  // Check if current user has permission to view users
  const hasViewUsersPermission = await hasPermission(currentUserData.role, 'view:users');
  
  if (!hasViewUsersPermission) {
    return { users: [], error: 'Insufficient permissions to view users' };
  }
  
  // Fetch all users with their roles
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false });
  
  if (usersError) {
    return { users: [], error: usersError.message };
  }
  
  return { users, error: null };
} 