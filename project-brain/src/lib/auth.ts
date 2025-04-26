import { redirect } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Define user roles with clear hierarchy
export type UserRole = 'admin' | 'director' | 'team' | 'client' | 'builder';

// Define permissions based on capabilities
export type Permission = 
  | 'manage:users'     // Create, update, delete users
  | 'view:users'       // View user details
  | 'manage:projects'  // Create, update, delete projects
  | 'view:projects'    // View project details
  | 'manage:content'   // Manage content and assets
  | 'submit:content'   // Submit content for review
  | 'view:analytics'   // View analytics and reports
  | 'manage:settings'  // Manage application settings
  | 'manage:roles';    // Manage user roles and permissions

// Define role hierarchy and permissions
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  'admin': [], // Admin is top level, not inheriting from anyone
  'director': ['admin'], // Director inherits admin permissions
  'team': ['director', 'admin'], // Team inherits director and admin permissions
  'client': [], // Client has its own permissions
  'builder': ['client'], // Builder inherits client permissions
};

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'admin': [
    'manage:users', 'view:users', 'manage:projects', 'view:projects', 
    'manage:content', 'submit:content', 'view:analytics', 'manage:settings', 'manage:roles'
  ],
  'director': [
    'view:users', 'manage:projects', 'view:projects', 
    'manage:content', 'submit:content', 'view:analytics'
  ],
  'team': [
    'view:projects', 'manage:content', 'submit:content', 'view:analytics'
  ],
  'client': [
    'view:projects', 'submit:content'
  ],
  'builder': [
    'view:projects'
  ]
};

/**
 * Check if a user has a specific role
 */
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  
  // Direct role match
  if (userRole === requiredRole) return true;
  
  // Check if userRole inherits from requiredRole via hierarchy
  const inheritedRoles = getInheritedRoles(userRole);
  return inheritedRoles.includes(requiredRole);
}

/**
 * Check if a user has any of the required roles
 */
export function hasRequiredRole(userRole: UserRole | undefined, requiredRoles: UserRole[]): boolean {
  if (!userRole || requiredRoles.length === 0) return false;
  return requiredRoles.some(role => hasRole(userRole, role));
}

/**
 * Get all roles a user inherits from, including ancestor roles
 */
export function getInheritedRoles(role: UserRole): UserRole[] {
  const result: UserRole[] = [];
  const visited = new Set<UserRole>();
  
  function traverse(currentRole: UserRole) {
    if (visited.has(currentRole)) return;
    visited.add(currentRole);
    
    const parentRoles = ROLE_HIERARCHY[currentRole] || [];
    for (const parentRole of parentRoles) {
      result.push(parentRole);
      traverse(parentRole);
    }
  }
  
  traverse(role);
  return result;
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  
  // Check direct permissions
  if (ROLE_PERMISSIONS[userRole].includes(permission)) {
    return true;
  }
  
  // Check inherited permissions
  const inheritedRoles = getInheritedRoles(userRole);
  return inheritedRoles.some(role => ROLE_PERMISSIONS[role].includes(permission));
}

/**
 * Check if a user has all the required permissions
 */
export function hasAllPermissions(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  if (!userRole || permissions.length === 0) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  if (!userRole || permissions.length === 0) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions available to a role (including inherited)
 */
export function getAllPermissions(userRole: UserRole | undefined): Permission[] {
  if (!userRole) return [];
  
  // Start with direct permissions
  const permissions = new Set<Permission>(ROLE_PERMISSIONS[userRole] || []);
  
  // Add inherited permissions
  const inheritedRoles = getInheritedRoles(userRole);
  for (const role of inheritedRoles) {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    for (const permission of rolePermissions) {
      permissions.add(permission);
    }
  }
  
  return Array.from(permissions);
}

export type AuthRedirectResult = {
  redirect: boolean;
  destination?: string;
};

/**
 * Utility to check if the current user has permission to access a route
 * and redirect if they don't
 */
export async function checkPermissionAndRedirect(
  requiredPermission: Permission,
  redirectPath: string = '/unauthorized'
): Promise<AuthRedirectResult> {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { redirect: true, destination: '/login' };
  }
  
  // Fetch user's role from database
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (error || !userData) {
    return { redirect: true, destination: '/login' };
  }
  
  const userRole = userData.role as UserRole;
  
  if (!hasPermission(userRole, requiredPermission)) {
    return { redirect: true, destination: redirectPath };
  }
  
  return { redirect: false };
}

/**
 * Get the current user's role from the session
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (error || !userData) {
    return null;
  }
  
  return userData.role as UserRole;
}
