/**
 * Staging Environment Configuration
 */
module.exports = {
  env: 'staging',
  api: {
    baseUrl: 'https://api.staging.your-url.com',
    timeout: 15000, // 15 seconds
  },
  supabase: {
    // Overridden by environment variables
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  features: {
    debug: true, // Enable debugging in staging
    mockApi: false,
    analytics: true,
  },
  logging: {
    level: 'warn', // Log warnings and errors in staging
    captureErrors: true,
  },
  security: {
    captchaEnabled: true,
    rateLimit: {
      enabled: true,
      maxRequests: 200, // Higher limit for testing
      windowMs: 15 * 60 * 1000, // Per 15 minutes
    },
  },
}; 