import { type ReactNode } from 'react';
import { UserRole, Permission, hasRole, hasPermission } from '@/lib/auth';
import { getCurrentUserRole } from '@/lib/auth';
import { useEffect, useState } from 'react';

interface RoleGuardProps {
  /**
   * Content to render if user has the required role
   */
  children: ReactNode;
  
  /**
   * Role required to view the content
   */
  requiredRole?: UserRole;
  
  /**
   * Array of roles where any one is sufficient to view the content
   */
  anyRole?: UserRole[];
  
  /**
   * Specific permission required to view the content
   */
  permission?: Permission;
  
  /**
   * Array of permissions where any one is sufficient
   */
  anyPermission?: Permission[];
  
  /**
   * Array of permissions where all are required
   */
  allPermissions?: Permission[];
  
  /**
   * Content to render if user doesn't have the required role/permission
   */
  fallback?: ReactNode;
}

/**
 * Component to conditionally render content based on user's role and permissions
 */
export function RoleGuard({
  children,
  requiredRole,
  anyRole,
  permission,
  anyPermission,
  allPermissions,
  fallback = null
}: RoleGuardProps) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const role = await getCurrentUserRole();
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // No user or role found
  if (!userRole) {
    return fallback;
  }
  
  // Check specific required role
  if (requiredRole && !hasRole(userRole, requiredRole)) {
    return fallback;
  }
  
  // Check if user has any of the specified roles
  if (anyRole && anyRole.length > 0) {
    const hasAnyRequiredRole = anyRole.some(role => hasRole(userRole, role));
    if (!hasAnyRequiredRole) {
      return fallback;
    }
  }
  
  // Check specific permission
  if (permission && !hasPermission(userRole, permission)) {
    return fallback;
  }
  
  // Check if user has any of the specified permissions
  if (anyPermission && anyPermission.length > 0) {
    const hasAnyRequiredPermission = anyPermission.some(perm => hasPermission(userRole, perm));
    if (!hasAnyRequiredPermission) {
      return fallback;
    }
  }
  
  // Check if user has all of the specified permissions
  if (allPermissions && allPermissions.length > 0) {
    const hasAllRequiredPermissions = allPermissions.every(perm => hasPermission(userRole, perm));
    if (!hasAllRequiredPermissions) {
      return fallback;
    }
  }
  
  // User has the necessary role/permissions, render the children
  return <>{children}</>;
}

/**
 * Component to display content only visible to admins
 */
export function AdminOnly({ children, fallback = null }: Omit<RoleGuardProps, 'requiredRole'>) {
  return <RoleGuard requiredRole="admin" fallback={fallback}>{children}</RoleGuard>;
}

/**
 * Component to display content only visible to directors and above
 */
export function DirectorOnly({ children, fallback = null }: Omit<RoleGuardProps, 'requiredRole'>) {
  return <RoleGuard requiredRole="director" fallback={fallback}>{children}</RoleGuard>;
}

/**
 * Component to display content only visible to team members and above
 */
export function TeamOnly({ children, fallback = null }: Omit<RoleGuardProps, 'requiredRole'>) {
  return <RoleGuard requiredRole="team" fallback={fallback}>{children}</RoleGuard>;
}

/**
 * Component to display content only visible to clients and above
 */
export function ClientOnly({ children, fallback = null }: Omit<RoleGuardProps, 'requiredRole'>) {
  return <RoleGuard requiredRole="client" fallback={fallback}>{children}</RoleGuard>;
} 