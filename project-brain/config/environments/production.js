/**
 * Production Environment Configuration
 */
module.exports = {
  env: 'production',
  api: {
    baseUrl: 'https://api.your-production-url.com',
    timeout: 15000, // 15 seconds
  },
  supabase: {
    // Overridden by environment variables
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  features: {
    debug: false,
    mockApi: false,
    analytics: true,
  },
  logging: {
    level: 'error', // Only log errors in production
    captureErrors: true,
  },
  security: {
    captchaEnabled: true,
    rateLimit: {
      enabled: true,
      maxRequests: 100, // Max 100 requests
      windowMs: 15 * 60 * 1000, // Per 15 minutes
    },
  },
}; 