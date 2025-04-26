'use server';

import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { UserRole, Permission, hasPermission } from '../auth';
import { redirect } from 'next/navigation';

// Schema for user registration
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  role: z.enum(['client', 'builder', 'team', 'director', 'admin'] as const).default('client'),
});

// Schema for updating user roles
const updateRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['client', 'builder', 'team', 'director', 'admin'] as const),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Register a new user with the specified role
 */
export async function registerUser(formData: RegisterFormData) {
  try {
    // Validate form data
    const validatedData = registerSchema.parse(formData);
    
    const supabase = createServerActionClient({ cookies });
    
    // Check if we're already authenticated (admins can create users)
    const { data: { session } } = await supabase.auth.getSession();
    let adminCreatedUser = false;
    
    // If an admin is creating another user, they can assign any role
    if (session) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (userData?.role === 'admin') {
        adminCreatedUser = true;
      } else if (userData?.role === 'director' && 
                (validatedData.role === 'client' || validatedData.role === 'builder')) {
        // Directors can only create clients or builders
        adminCreatedUser = true;
      } else if (validatedData.role !== 'client') {
        // Non-admins/directors can only register users as clients
        return { error: 'You do not have permission to create users with this role' };
      }
    } else if (validatedData.role !== 'client') {
      // Anonymous registrations can only create client accounts
      return { error: 'Anonymous registrations can only create client accounts' };
    }
    
    // Register the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    
    if (authError) {
      return { error: authError.message };
    }
    
    if (!authData.user) {
      return { error: 'Failed to create user' };
    }
    
    // Create the user profile with the role in our users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        role: validatedData.role,
        created_at: new Date().toISOString(),
      });
    
    if (profileError) {
      return { error: profileError.message };
    }
    
    // Log the user action for audit purposes
    await supabase.from('audit_logs').insert({
      action: 'user_registration',
      user_id: adminCreatedUser ? session?.user.id : authData.user.id,
      target_user_id: authData.user.id,
      details: JSON.stringify({
        email: validatedData.email,
        role: validatedData.role,
        admin_created: adminCreatedUser,
      }),
      timestamp: new Date().toISOString(),
    });
    
    return { success: true, user: authData.user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Update a user's role (admin only)
 */
export async function updateUserRole(formData: z.infer<typeof updateRoleSchema>) {
  try {
    // Validate form data
    const validatedData = updateRoleSchema.parse(formData);
    
    const supabase = createServerActionClient({ cookies });
    
    // Check if we're authenticated as admin
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { error: 'Authentication required' };
    }
    
    // Get the current user's role
    const { data: currentUserData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (!currentUserData) {
      return { error: 'User profile not found' };
    }
    
    const userRole = currentUserData.role as UserRole;
    
    // Check if user has permission to update roles
    if (!hasPermission(userRole, 'manage:roles')) {
      return { error: 'You do not have permission to update user roles' };
    }
    
    // Directors can only update to client or builder
    if (userRole === 'director' && 
        validatedData.role !== 'client' && 
        validatedData.role !== 'builder') {
      return { error: 'Directors can only assign client or builder roles' };
    }
    
    // Update the user's role
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: validatedData.role })
      .eq('id', validatedData.userId);
    
    if (updateError) {
      return { error: updateError.message };
    }
    
    // Log the action for audit purposes
    await supabase.from('audit_logs').insert({
      action: 'role_update',
      user_id: session.user.id,
      target_user_id: validatedData.userId,
      details: JSON.stringify({
        new_role: validatedData.role,
      }),
      timestamp: new Date().toISOString(),
    });
    
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Deactivate/reactivate a user account (admin only)
 */
export async function toggleUserActive(userId: string, active: boolean) {
  try {
    const supabase = createServerActionClient({ cookies });
    
    // Check if we're authenticated as admin
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { error: 'Authentication required' };
    }
    
    // Get the current user's role
    const { data: currentUserData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (!currentUserData) {
      return { error: 'User profile not found' };
    }
    
    const userRole = currentUserData.role as UserRole;
    
    // Check if user has permission to manage users
    if (!hasPermission(userRole, 'manage:users')) {
      return { error: 'You do not have permission to manage user accounts' };
    }
    
    // Update the user's active status
    const { error: updateError } = await supabase
      .from('users')
      .update({ active })
      .eq('id', userId);
    
    if (updateError) {
      return { error: updateError.message };
    }
    
    // Log the action for audit purposes
    await supabase.from('audit_logs').insert({
      action: active ? 'user_activated' : 'user_deactivated',
      user_id: session.user.id,
      target_user_id: userId,
      timestamp: new Date().toISOString(),
    });
    
    return { success: true };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Get the currently authenticated user with their role
 */
export async function getCurrentUser() {
  const supabase = createServerActionClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (!userData) {
    return null;
  }
  
  return {
    id: userData.id,
    email: userData.email,
    role: userData.role as UserRole,
    active: userData.active,
  };
}

/**
 * Verify that the current user has a specific permission
 * and redirect if they don't
 */
export async function requirePermission(permission: Permission, redirectTo: string = '/unauthorized') {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  if (!hasPermission(user.role, permission)) {
    redirect(redirectTo);
  }
}

/**
 * Get a list of users (for admin panels)
 */
export async function getUsers() {
  const user = await getCurrentUser();
  
  if (!user) {
    return { error: 'Authentication required' };
  }
  
  if (!hasPermission(user.role, 'view:users')) {
    return { error: 'You do not have permission to view users' };
  }
  
  const supabase = createServerActionClient({ cookies });
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    return { error: error.message };
  }
  
  return { users };
} 