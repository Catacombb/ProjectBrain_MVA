import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { UserRole, hasPermission } from './src/lib/auth';

// Define route permissions mapping
const ROUTE_PERMISSIONS: Record<string, {
  requiredRole?: UserRole;
  isPublic?: boolean;
}> = {
  // Authentication routes (public)
  '/login': { isPublic: true },
  '/register': { isPublic: true },
  '/forgot-password': { isPublic: true },
  '/reset-password': { isPublic: true },
  
  // Dashboard routes (protected)
  '/dashboard': { requiredRole: 'client' },
  '/dashboard/settings': { requiredRole: 'client' },
  
  // Admin routes (admin only)
  '/dashboard/admin': { requiredRole: 'admin' },
  '/dashboard/users': { requiredRole: 'admin' },
  
  // Director routes
  '/dashboard/projects': { requiredRole: 'director' },
  
  // Team routes
  '/dashboard/content': { requiredRole: 'team' },
};

// Define security headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https://*.supabase.co; " +
    "font-src 'self'; " +
    "connect-src 'self' https://*.supabase.co; " +
    "frame-src 'self' https://js.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self';"
};

// List of paths that should be excluded from middleware processing
const excludedPaths = [
  '/api/', // Skip API routes, they'll have their own auth
  '/_next/',
  '/favicon.ico',
  '/public/'
];

export async function middleware(request: NextRequest) {
  // Skip middleware for excluded paths
  const { pathname } = request.nextUrl;
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Create a response object that we'll modify and return
  const response = NextResponse.next();

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add basic CSRF protection
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    
    // Check if referer or origin is missing, or if they don't match our domain
    if (!referer || !origin || !referer.includes(request.headers.get('host') || '')) {
      return new NextResponse('Invalid Cross-Site Request Forbidden', { 
        status: 403,
        statusText: 'Forbidden'
      });
    }
  }

  // Initialize Supabase client
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check route permissions
  const routeConfig = findRouteConfig(pathname);
  
  if (routeConfig?.isPublic) {
    // Public route - allow access
    return response;
  }
  
  if (!session) {
    // Not authenticated and route is not public - redirect to login
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // User is authenticated, check for role-based access if needed
  if (routeConfig?.requiredRole) {
    // Fetch user's role from the database
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (error || !userData || !userData.role) {
      // Error or no role defined - redirect to unauthorized
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    const userRole = userData.role as UserRole;
    
    // Check if user's role can access this route
    if (!hasRole(userRole, routeConfig.requiredRole)) {
      // Insufficient permissions - redirect to unauthorized
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  // Add user info to headers for use in server components
  if (session?.user) {
    response.headers.set('x-user-id', session.user.id);
    response.headers.set('x-user-email', session.user.email || '');
  }
  
  return response;
}

// Helper function to find the most specific route config
function findRouteConfig(path: string): { requiredRole?: UserRole; isPublic?: boolean } | undefined {
  // Try exact match first
  if (path in ROUTE_PERMISSIONS) {
    return ROUTE_PERMISSIONS[path];
  }
  
  // Try matching patterns with wildcard (for nested routes)
  for (const [route, config] of Object.entries(ROUTE_PERMISSIONS)) {
    // Handle exact matches and wildcard patterns
    if (route.endsWith('/*') && path.startsWith(route.slice(0, -2))) {
      return config;
    }
  }
  
  // Default to protected for unlisted routes
  return { requiredRole: 'client' };
}

// Helper function to check if a user has a specific role (including inheritance)
function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === requiredRole) return true;
  
  // Role hierarchy (simplified for middleware)
  const roleHierarchy: Record<UserRole, UserRole[]> = {
    'admin': [], 
    'director': ['admin'], 
    'team': ['director', 'admin'],
    'client': [],
    'builder': ['client']
  };
  
  // Check if user's role inherits from the required role
  function checkInheritance(current: UserRole, target: UserRole): boolean {
    if (current === target) return true;
    
    for (const parent of roleHierarchy[current]) {
      if (checkInheritance(parent, target)) return true;
    }
    
    return false;
  }
  
  return checkInheritance(userRole, requiredRole);
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public directory (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 