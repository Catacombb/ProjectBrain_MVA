import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { hasRole, hasPermission, UserRole, Permission } from '@/lib/auth';

interface PermissionGateProps {
  children: ReactNode;
  requiredPermission?: Permission;
  requiredRole?: UserRole;
  fallback?: ReactNode;
  redirect?: string;
}

/**
 * A component that conditionally renders its children based on the user's permissions.
 * Can check for a specific permission, a specific role, or both.
 * 
 * @example
 * <PermissionGate requiredPermission="manage:users">
 *   <AdminControls />
 * </PermissionGate>
 * 
 * @example
 * <PermissionGate 
 *   requiredRole="admin" 
 *   fallback={<p>You need admin access to view this content.</p>}
 * >
 *   <SensitiveData />
 * </PermissionGate>
 */
export default function PermissionGate({
  children,
  requiredPermission,
  requiredRole,
  fallback = null,
  redirect
}: PermissionGateProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (redirect) {
            router.push(redirect);
            return;
          }
          setHasAccess(false);
          return;
        }
        
        // Get user's role from the database
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (error || !userData) {
          setHasAccess(false);
          return;
        }
        
        const role = userData.role as UserRole;
        setUserRole(role);
        
        // Check access based on role and/or permission
        let accessGranted = true;
        
        if (requiredRole) {
          accessGranted = accessGranted && hasRole(role, requiredRole);
        }
        
        if (requiredPermission) {
          accessGranted = accessGranted && hasPermission(role, requiredPermission);
        }
        
        setHasAccess(accessGranted);
        
        // Redirect if specified and no access
        if (!accessGranted && redirect) {
          router.push(redirect);
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkPermission();
  }, [supabase, requiredPermission, requiredRole, redirect, router]);
  
  // Display a loading state while checking permissions
  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // If the user has the required permissions, render the children
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Otherwise, render the fallback or null
  return <>{fallback}</>;
} 