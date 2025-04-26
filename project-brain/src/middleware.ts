import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth/callback',
  '/api/auth/logout',
  '/api/auth/reset-password',
  '/unauthorized'
];

// Define route protection by permission
const routePermissions = {
  '/dashboard': ['view:projects'],
  '/projects': ['view:projects'],
  '/projects/new': ['manage:projects'],
  '/projects/edit': ['manage:projects'],
  '/users': ['view:users'],
  '/users/manage': ['manage:users'],
  '/settings': ['manage:settings'],
  '/analytics': ['view:analytics'],
};

// Define route protection by role
const routeRoles = {
  '/admin': ['admin'],
  '/director': ['admin', 'director'],
};

export async function middleware(request: NextRequest) {
  // Initialize Supabase client
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Check if the path is public
  const path = request.nextUrl.pathname;
  if (publicRoutes.some(route => path === route || path.startsWith(`${route}/`))) {
    return res;
  }

  // Verify the user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, redirect to login
  if (!session) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Get the user's role from the database
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error || !userData) {
    // If we couldn't get the role, log them out
    return NextResponse.redirect(new URL('/api/auth/logout', request.url));
  }

  const userRole = userData.role;

  // Check role-based access for specific routes
  for (const [route, allowedRoles] of Object.entries(routeRoles)) {
    if (path === route || path.startsWith(`${route}/`)) {
      // Check if the user's role is in the allowed roles
      const hasAccess = allowedRoles.includes(userRole);
      
      if (!hasAccess) {
        // Log unauthorized access attempt
        await supabase.rpc('log_auth_event', {
          user_id: session.user.id,
          event_type: 'unauthorized_access',
          event_details: JSON.stringify({
            path,
            role: userRole,
            required_roles: allowedRoles
          }),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        });
        
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  // Check permission-based access for specific routes
  for (const [route, requiredPermissions] of Object.entries(routePermissions)) {
    if (path === route || path.startsWith(`${route}/`)) {
      // For permission checks, we need to make a serverless function call
      // since the permission logic is more complex and involves role inheritance
      const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke('check-permissions', {
        body: {
          userRole,
          requiredPermissions
        }
      });

      if (permissionError || !permissionCheck?.hasPermission) {
        // Log unauthorized access attempt
        await supabase.rpc('log_auth_event', {
          user_id: session.user.id,
          event_type: 'unauthorized_access',
          event_details: JSON.stringify({
            path,
            role: userRole,
            required_permissions: requiredPermissions
          }),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        });
        
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  // Add security headers
  const response = NextResponse.next();
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.supabase.io wss://*.supabase.co;"
  );
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Frame options to prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Content type options
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  return response;
}

// Configure the paths that this middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public directory
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 