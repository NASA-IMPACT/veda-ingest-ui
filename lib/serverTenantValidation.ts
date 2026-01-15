import { auth } from '@/auth';
import { NextRequest } from 'next/server';

export interface TenantValidationResult {
  isValid: boolean;
  userTenants: string[];
  error?: string;
}

/**
 * Validates that a user has access to a specific tenant
 * @param tenantId - The tenant to validate access for
 * @param requestOrSession - Optional Next.js request object or existing session
 * @returns Promise<TenantValidationResult>
 */
export async function validateTenantAccess(
  tenantId: string,
  requestOrSession?: NextRequest | any
): Promise<TenantValidationResult> {
  try {
    let session;

    // If a session object is passed directly, use it
    if (requestOrSession && requestOrSession.tenants) {
      session = requestOrSession;
    } else {
      // Otherwise, get the session
      session = await auth();
    }

    if (!session?.tenants) {
      return {
        isValid: false,
        userTenants: [],
        error: 'No tenant access found in session',
      };
    }

    const userTenants = session.tenants as string[];
    const hasAccess = userTenants.includes(tenantId);

    return {
      isValid: hasAccess,
      userTenants,
      error: hasAccess ? undefined : `Access denied for tenant: ${tenantId}`,
    };
  } catch (error) {
    console.error('Tenant validation error:', error);
    return {
      isValid: false,
      userTenants: [],
      error: 'Failed to validate tenant access',
    };
  }
}

/**
 * Gets all tenants that the current user has access to
 * @param requestOrSession - Optional Next.js request object or existing session
 * @returns Promise<string[]>
 */
export async function getUserTenants(
  requestOrSession?: NextRequest | any
): Promise<string[]> {
  try {
    // If a session object is passed directly, use it
    if (requestOrSession && requestOrSession.tenants) {
      return (requestOrSession.tenants as string[]) || [];
    }

    // Otherwise, get the session
    const session = await auth();
    return (session?.tenants as string[]) || [];
  } catch (error) {
    console.error('Error getting user tenants:', error);
    return [];
  }
}
