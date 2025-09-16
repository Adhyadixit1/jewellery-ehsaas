/**
 * Test Trusted Types Implementation
 * 
 * This file provides utilities to test and verify that Trusted Types
 * are working correctly in the application.
 */

import { isTrustedTypesSupported, getAvailablePolicies, createTrustedHTML } from './trustedTypes';

/**
 * Test if Trusted Types are properly configured
 */
export function testTrustedTypesConfiguration(): void {
  console.group('🔒 Trusted Types Configuration Test');
  
  // Test 1: Check if Trusted Types are supported
  const supported = isTrustedTypesSupported();
  console.log('✅ Trusted Types Supported:', supported);
  
  if (!supported) {
    console.warn('⚠️  Trusted Types are not supported in this browser');
    console.groupEnd();
    return;
  }
  
  // Test 2: Check available policies
  const policies = getAvailablePolicies();
  console.log('✅ Available Policies:', policies);
  
  // Test 3: Test creating trusted HTML
  try {
    const trustedHTML = createTrustedHTML('<div>Test Content</div>');
    console.log('✅ Trusted HTML Creation:', trustedHTML.toString());
  } catch (error) {
    console.error('❌ Trusted HTML Creation Failed:', error);
  }
  
  // Test 4: Test with potentially dangerous content
  try {
    const dangerousHTML = createTrustedHTML('<script>alert("xss")</script><div>Safe Content</div>');
    console.log('✅ Dangerous Content Handling:', dangerousHTML.toString());
  } catch (error) {
    console.error('❌ Dangerous Content Handling Failed:', error);
  }
  
  console.groupEnd();
}

/**
 * Test React-specific Trusted Types usage
 */
export function testReactTrustedTypes(): void {
  console.group('🔧 React Trusted Types Test');
  
  if (!isTrustedTypesSupported()) {
    console.warn('⚠️  Trusted Types not supported, skipping React tests');
    console.groupEnd();
    return;
  }
  
  // Test React DOM policy
  try {
    const reactDOMPolicy = window.trustedTypes?.getPolicy('react-dom');
    if (reactDOMPolicy) {
      const testHTML = reactDOMPolicy.createHTML('<div>React Test</div>');
      console.log('✅ React DOM Policy Working:', testHTML.toString());
    } else {
      console.warn('⚠️  React DOM Policy not found');
    }
  } catch (error) {
    console.error('❌ React DOM Policy Test Failed:', error);
  }
  
  // Test Next Themes policy
  try {
    const nextThemesPolicy = window.trustedTypes?.getPolicy('next-themes');
    if (nextThemesPolicy) {
      const testHTML = nextThemesPolicy.createHTML('<div>Next Themes Test</div>');
      console.log('✅ Next Themes Policy Working:', testHTML.toString());
    } else {
      console.warn('⚠️  Next Themes Policy not found');
    }
  } catch (error) {
    console.error('❌ Next Themes Policy Test Failed:', error);
  }
  
  console.groupEnd();
}

/**
 * Run all Trusted Types tests
 */
export function runAllTrustedTypesTests(): void {
  console.log('🚀 Running Trusted Types Tests...');
  testTrustedTypesConfiguration();
  testReactTrustedTypes();
  console.log('✅ Trusted Types Tests Complete');
}

// Auto-run tests in development mode
if (process.env.NODE_ENV === 'development') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runAllTrustedTypesTests, 1000); // Delay to ensure policies are initialized
    });
  } else {
    setTimeout(runAllTrustedTypesTests, 1000);
  }
}
