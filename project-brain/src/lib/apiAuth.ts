import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UserRole, Permission, hasPermission, hasRole } from './auth';

// Types for route handlers
type NextRouteHandler = (req: NextRequest) => Promise<NextResponse> | NextResponse;
type RouteConfig = {
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  anyPermission?: Permission[];
};

/**
 * Audit logging function to record API access attempts
 */
async function logApiAccess(
  path: string, 
  method: string, 
  userId: string | null, 
  userRole: UserRole | null, 
  success: boolean, 
  reason?: string
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    await supabase.from('audit_logs').insert({
      path,
      method,
      user_id: userId,
      user_role: userRole,
      success,
      reason,
      timestamp: new Date().toISOString(),
      ip_address: 'Captured in middleware', // Actual IP would be captured in middleware
    });
  } catch (error) {
    // Log to console but don't block the request
    console.error('Error logging API access:', error);
  }
}

/**
 * Rate limiting implementation (in-memory for simplicity)
 * In production, use Redis or another distributed cache
 */
const requestCounts: Record<string, { count: number, resetTime: number }> = {};
const MAX_REQUESTS_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userKey = userId || 'anonymous';
  
  // Initialize or reset if window expired
  if (!requestCounts[userKey] || requestCounts[userKey].resetTime < now) {
    requestCounts[userKey] = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    };
    return false;
  }
  
  // Increment count
  requestCounts[userKey].count++;
  
  // Check if limit exceeded
  return requestCounts[userKey].count > MAX_REQUESTS_PER_MINUTE;
}

/**
 * Higher-order function to protect API routes with role-based access control
 */
export function withAuth(handler: NextRouteHandler, config: RouteConfig = {}): NextRouteHandler {
  return async (req: NextRequest) => {
    const { requiredRole, requiredPermissions, anyPermission } = config;
    const path = req.nextUrl.pathname;
    const method = req.method;
    
    try {
      // Initialize Supabase client
      const supabase = createRouteHandlerClient({ cookies });
      
      // Verify authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Log unauthorized access attempt
        await logApiAccess(path, method, null, null, false, 'No session');
        
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      const userId = session.user.id;
      
      // Check rate limiting
      if (isRateLimited(userId)) {
        await logApiAccess(path, method, userId, null, false, 'Rate limited');
        
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
      
      // If role checks are needed, fetch the user's role
      if (requiredRole || requiredPermissions || anyPermission) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();
        
        if (error || !userData || !userData.role) {
          await logApiAccess(path, method, userId, null, false, 'Role not found');
          
          return NextResponse.json(
            { error: 'User role not found' },
            { status: 403 }
          );
        }
        
        const userRole = userData.role as UserRole;
        
        // Check required role
        if (requiredRole && !hasRole(userRole, requiredRole)) {
          await logApiAccess(path, method, userId, userRole, false, 'Insufficient role');
          
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
        
        // Check all required permissions
        if (requiredPermissions && requiredPermissions.length > 0) {
          const hasAllRequired = requiredPermissions.every(
            permission => hasPermission(userRole, permission)
          );
          
          if (!hasAllRequired) {
            await logApiAccess(
              path, 
              method, 
              userId, 
              userRole, 
              false, 
              'Missing required permissions'
            );
            
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        }
        
        // Check any required permissions
        if (anyPermission && anyPermission.length > 0) {
          const hasAnyRequired = anyPermission.some(
            permission => hasPermission(userRole, permission)
          );
          
          if (!hasAnyRequired) {
            await logApiAccess(
              path, 
              method, 
              userId, 
              userRole, 
              false, 
              'No matching permissions'
            );
            
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        }
        
        // Log successful access
        await logApiAccess(path, method, userId, userRole, true);
      } else {
        // No role checks required, just log the access
        await logApiAccess(path, method, userId, null, true);
      }
      
      // All checks passed, call the original handler
      return handler(req);
    } catch (error) {
      console.error('Error in API auth middleware:', error);
      
      // Log error
      await logApiAccess(
        path, 
        method, 
        null, 
        null, 
        false, 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Utility to create a protected API route that requires admin permissions
 */
export function withAdminAuth(handler: NextRouteHandler): NextRouteHandler {
  return withAuth(handler, { requiredRole: 'admin' });
}

/**
 * Utility to create a protected API route that requires director permissions
 */
export function withDirectorAuth(handler: NextRouteHandler): NextRouteHandler {
  return withAuth(handler, { requiredRole: 'director' });
}

/**
 * Utility to create a protected API route that requires specific permissions
 */
export function withPermission(handler: NextRouteHandler, permission: Permission): NextRouteHandler {
  return withAuth(handler, { requiredPermissions: [permission] });
}

/**
 * Utility to create a protected API route that requires any of the specified permissions
 */
export function withAnyPermission(handler: NextRouteHandler, permissions: Permission[]): NextRouteHandler {
  return withAuth(handler, { anyPermission: permissions });
} 