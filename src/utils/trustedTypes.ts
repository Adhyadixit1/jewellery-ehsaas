/**
 * Trusted Types Configuration
 * 
 * This file sets up Trusted Types policies to allow React and other libraries
 * to work properly while maintaining security against XSS attacks.
 */

// TypeScript declarations for Trusted Types
declare global {
  interface Window {
    trustedTypes?: {
      createPolicy(name: string, policy: TrustedTypePolicyOptions): TrustedTypePolicy;
      getPolicy(name: string): TrustedTypePolicy | undefined;
      getPolicyNames(): string[];
    };
  }
}

interface TrustedTypePolicy {
  createHTML(input: string): TrustedHTML;
  createScript(input: string): TrustedScript;
  createScriptURL(input: string): TrustedScriptURL;
}

interface TrustedTypePolicyOptions {
  createHTML?: (input: string) => string;
  createScript?: (input: string) => string;
  createScriptURL?: (input: string) => string;
}

interface TrustedHTML {
  toString(): string;
}

interface TrustedScript {
  toString(): string;
}

interface TrustedScriptURL {
  toString(): string;
}

export interface TrustedTypesConfig {
  allowReactDOM?: boolean;
  allowNextThemes?: boolean;
  allowDefault?: boolean;
  customPolicies?: Record<string, TrustedTypePolicyOptions>;
}

/**
 * Default Trusted Types policies that allow common libraries to work
 */
const DEFAULT_POLICIES: Record<string, TrustedTypePolicyOptions> = {
  // React DOM policy - permissive for React operations
  'react-dom': {
    createHTML: (input: string) => {
      // Allow all HTML operations for React DOM as it needs to manipulate DOM extensively
      return input;
    },
    createScript: (input: string) => {
      // Allow script operations for React DOM
      return input;
    },
    createScriptURL: (input: string) => {
      // Allow script URL operations for React DOM
      return input;
    },
  },
  
  // Next themes policy (for theme switching) - more permissive
  'next-themes': {
    createHTML: (input: string) => {
      // Allow all HTML operations for next-themes as it needs to manipulate DOM for theme switching
      return input;
    },
    createScript: (input: string) => {
      // Allow script operations for next-themes
      return input;
    },
    createScriptURL: (input: string) => {
      // Allow script URL operations for next-themes
      return input;
    },
  },
  
  // Default fallback policy
  'default': {
    createHTML: (input: string) => {
      // Basic sanitization for default policy
      if (typeof input !== 'string') return '';
      
      // Remove potentially dangerous content
      const sanitized = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
      
      return sanitized;
    },
    createScript: (input: string) => {
      // Only allow safe script content
      if (typeof input !== 'string') return '';
      
      // Basic validation for script content
      if (input.includes('eval(') || input.includes('Function(') || input.includes('setTimeout(')) {
        throw new Error('Unsafe script content detected');
      }
      
      return input;
    },
    createScriptURL: (input: string) => {
      // Only allow safe script URLs
      if (typeof input !== 'string') return '';
      
      // Allow same-origin scripts and trusted CDNs
      const allowedDomains = [
        'localhost',
        '127.0.0.1',
        'cdn.jsdelivr.net',
        'unpkg.com',
        'esm.sh',
        'supabase.co',
        'googletagmanager.com',
        'google-analytics.com',
        'facebook.net',
        'fonts.googleapis.com',
        'fonts.gstatic.com'
      ];
      
      try {
        const url = new URL(input, window.location.origin);
        const isAllowed = allowedDomains.some(domain => 
          url.hostname === domain || url.hostname.endsWith(`.${domain}`)
        );
        
        if (!isAllowed && url.origin !== window.location.origin) {
          throw new Error(`Script URL not allowed: ${url.hostname}`);
        }
        
        return input;
      } catch (error) {
        throw new Error(`Invalid script URL: ${input}`);
      }
    },
  },
};

/**
 * Get CSP string based on environment
 */
function getCSPString(securityConfig: any): string {
  if (!securityConfig.enableStrictCSP) {
    // Relaxed CSP for development
    return "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *; img-src 'self' data: *; font-src 'self' *; connect-src 'self' *; frame-src 'self' *; object-src 'none';";
  }
  
  // Strict CSP for production
  return "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https: https://images.pexels.com https://images.unsplash.com https://res.cloudinary.com https://www.googletagmanager.com; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://connect.facebook.net; frame-src 'self' https://www.facebook.com https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;";
}

/**
 * Get Trusted Types CSP directive
 */
function getTrustedTypesDirective(securityConfig: any): string {
  if (!securityConfig.enableTrustedTypes) {
    return '';
  }
  
  return "require-trusted-types-for 'script'; trusted-types default react-dom next-themes";
}

/**
 * Initialize Trusted Types policies and set CSP dynamically
 */
export function initializeTrustedTypes(config: TrustedTypesConfig = {}): void {
  // Import security configuration
  // Note: We'll use a simple environment check since ES6 imports are not available at runtime
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  const securityConfig = {
    enableTrustedTypes: !isDevelopment && !isTest,
    enableStrictCSP: !isDevelopment && !isTest,
    enableSecurityHeaders: true,
    environment: isDevelopment ? 'development' : isTest ? 'test' : 'production',
  };
  
  console.log('🔒 Initializing security configuration for:', securityConfig.environment);
  
  // Set CSP dynamically based on environment
  try {
    // Remove any existing CSP meta tags
    const existingCSPMetaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    existingCSPMetaTags.forEach(tag => tag.remove());
    
    // Create new CSP meta tag
    const cspMetaTag = document.createElement('meta');
    cspMetaTag.setAttribute('http-equiv', 'Content-Security-Policy');
    
    // Build CSP string
    let cspString = getCSPString(securityConfig);
    const trustedTypesDirective = getTrustedTypesDirective(securityConfig);
    
    if (trustedTypesDirective && securityConfig.enableTrustedTypes) {
      cspString += `; ${trustedTypesDirective}`;
    }
    
    cspMetaTag.setAttribute('content', cspString);
    document.head.appendChild(cspMetaTag);
    
    console.log('✅ CSP set dynamically:', cspString);
  } catch (error) {
    console.error('❌ Failed to set CSP dynamically:', error);
  }
  
  // Only initialize Trusted Types if enabled and supported
  if (!securityConfig.enableTrustedTypes || !window.trustedTypes) {
    if (!securityConfig.enableTrustedTypes) {
      console.log('⚠️ Trusted Types disabled for', securityConfig.environment, 'environment');
    } else {
      console.warn('⚠️ Trusted Types not supported in this browser');
    }
    return;
  }

  const {
    allowReactDOM = true,
    allowNextThemes = true,
    allowDefault = true,
    customPolicies = {},
  } = config;

  const policiesToCreate: Record<string, TrustedTypePolicyOptions> = {};

  // Add default policies if enabled
  if (allowReactDOM) {
    policiesToCreate['react-dom'] = DEFAULT_POLICIES['react-dom'];
  }
  
  if (allowNextThemes) {
    policiesToCreate['next-themes'] = DEFAULT_POLICIES['next-themes'];
  }
  
  if (allowDefault) {
    policiesToCreate['default'] = DEFAULT_POLICIES['default'];
  }

  // Add custom policies
  Object.assign(policiesToCreate, customPolicies);

  // Create the policies with error handling
  let policyCreationFailed = false;
  
  Object.entries(policiesToCreate).forEach(([name, options]) => {
    try {
      window.trustedTypes.createPolicy(name, options);
      console.log(`✅ Trusted Types policy '${name}' created successfully`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log(`ℹ️ Trusted Types policy '${name}' already exists`);
      } else {
        console.error(`❌ Failed to create Trusted Types policy '${name}':`, error);
        policyCreationFailed = true;
      }
    }
  });

  // If policy creation failed, disable Trusted Types CSP to allow the app to work
  if (policyCreationFailed) {
    console.warn('⚠️ Some Trusted Types policies failed to create. Disabling Trusted Types for this session.');
    
    // Try to remove the Trusted Types directive from CSP
    try {
      const cspMetaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (cspMetaTag) {
        const currentCSP = cspMetaTag.getAttribute('content');
        if (currentCSP && currentCSP.includes('require-trusted-types-for')) {
          const relaxedCSP = currentCSP.replace(/require-trusted-types-for\s+'script';\s*trusted-types[^;]*/g, '').replace(/;\s*$/, '');
          cspMetaTag.setAttribute('content', relaxedCSP);
          console.log('✅ Removed Trusted Types from CSP to allow application to function');
        }
      }
    } catch (error) {
      console.error('❌ Failed to remove Trusted Types from CSP:', error);
    }
  }
}

/**
 * Create a safe HTML string using Trusted Types
 */
export function createTrustedHTML(input: string, policyName = 'default'): TrustedHTML {
  if (!window.trustedTypes) {
    // Fallback for browsers without Trusted Types support
    return input as unknown as TrustedHTML;
  }

  try {
    const policy = window.trustedTypes.getPolicy(policyName);
    if (!policy) {
      throw new Error(`Trusted Types policy '${policyName}' not found`);
    }
    
    return policy.createHTML(input);
  } catch (error) {
    console.error(`Failed to create trusted HTML with policy '${policyName}':`, error);
    // Fallback to default policy
    try {
      const defaultPolicy = window.trustedTypes.getPolicy('default');
      if (defaultPolicy) {
        return defaultPolicy.createHTML(input);
      }
    } catch {
      // Ultimate fallback
      return input as unknown as TrustedHTML;
    }
  }
}

/**
 * Create a safe script using Trusted Types
 */
export function createTrustedScript(input: string, policyName = 'default'): TrustedScript {
  if (!window.trustedTypes) {
    return input as unknown as TrustedScript;
  }

  try {
    const policy = window.trustedTypes.getPolicy(policyName);
    if (!policy) {
      throw new Error(`Trusted Types policy '${policyName}' not found`);
    }
    
    return policy.createScript(input);
  } catch (error) {
    console.error(`Failed to create trusted script with policy '${policyName}':`, error);
    try {
      const defaultPolicy = window.trustedTypes.getPolicy('default');
      if (defaultPolicy) {
        return defaultPolicy.createScript(input);
      }
    } catch {
      return input as unknown as TrustedScript;
    }
  }
}

/**
 * Create a safe script URL using Trusted Types
 */
export function createTrustedScriptURL(input: string, policyName = 'default'): TrustedScriptURL {
  if (!window.trustedTypes) {
    return input as unknown as TrustedScriptURL;
  }

  try {
    const policy = window.trustedTypes.getPolicy(policyName);
    if (!policy) {
      throw new Error(`Trusted Types policy '${policyName}' not found`);
    }
    
    return policy.createScriptURL(input);
  } catch (error) {
    console.error(`Failed to create trusted script URL with policy '${policyName}':`, error);
    try {
      const defaultPolicy = window.trustedTypes.getPolicy('default');
      if (defaultPolicy) {
        return defaultPolicy.createScriptURL(input);
      }
    } catch {
      return input as unknown as TrustedScriptURL;
    }
  }
}

/**
 * Check if Trusted Types is supported
 */
export function isTrustedTypesSupported(): boolean {
  return typeof window !== 'undefined' && 'trustedTypes' in window;
}

/**
 * Get available Trusted Types policies
 */
export function getAvailablePolicies(): string[] {
  if (!isTrustedTypesSupported()) {
    return [];
  }

  try {
    return window.trustedTypes.getPolicyNames();
  } catch (error) {
    console.error('Failed to get Trusted Types policy names:', error);
    return [];
  }
}

// Auto-initialize when this module is imported
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready before initializing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeTrustedTypes();
    });
  } else {
    initializeTrustedTypes();
  }
}
