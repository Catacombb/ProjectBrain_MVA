/**
 * Development Environment Configuration
 */
module.exports = {
  env: 'development',
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 10000, // 10 seconds
  },
  supabase: {
    // Overridden by environment variables
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  features: {
    debug: true,
    mockApi: false, 
    analytics: false,
  },
  logging: {
    level: 'debug', // debug, info, warn, error
    captureErrors: true,
  },
  security: {
    captchaEnabled: false,
    rateLimit: {
      enabled: false,
    },
  },
}; 