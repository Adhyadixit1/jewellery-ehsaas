/**
 * Security Configuration
 * 
 * Centralized security configuration that can be adjusted based on environment
 */

export interface SecurityConfig {
  enableTrustedTypes: boolean;
  enableStrictCSP: boolean;
  enableSecurityHeaders: boolean;
  environment: 'development' | 'production' | 'test';
}

/**
 * Get security configuration based on environment
 */
export function getSecurityConfig(): SecurityConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    // Disable Trusted Types in development to avoid issues with third-party libraries
    enableTrustedTypes: !isDevelopment && !isTest,
    
    // Enable strict CSP in production, relaxed in development
    enableStrictCSP: !isDevelopment && !isTest,
    
    // Always enable security headers
    enableSecurityHeaders: true,
    
    environment: isDevelopment ? 'development' : isTest ? 'test' : 'production',
  };
}

/**
 * Check if current environment should enforce strict security
 */
export function shouldEnforceStrictSecurity(): boolean {
  const config = getSecurityConfig();
  return config.enableStrictCSP && config.enableSecurityHeaders;
}

/**
 * Get CSP string based on environment
 */
export function getCSPString(): string {
  const config = getSecurityConfig();
  
  if (!config.enableStrictCSP) {
    // Relaxed CSP for development
    return "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *; img-src 'self' data: *; font-src 'self' *; connect-src 'self' *; frame-src 'self' *; object-src 'none';";
  }
  
  // Strict CSP for production
  return "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https: https://images.pexels.com https://images.unsplash.com https://res.cloudinary.com https://www.googletagmanager.com; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://connect.facebook.net; frame-src 'self' https://www.facebook.com https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;";
}

/**
 * Get Trusted Types CSP directive
 */
export function getTrustedTypesDirective(): string {
  const config = getSecurityConfig();
  
  if (!config.enableTrustedTypes) {
    return '';
  }
  
  return "require-trusted-types-for 'script'; trusted-types default react-dom next-themes";
}
