import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateTenantAccess,
  getUserTenants,
} from '@/lib/serverTenantValidation';

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/lib/auth';

describe('Server-side Tenant Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateTenantAccess', () => {
    it('should return valid when user has access to tenant', async () => {
      (auth as any).mockResolvedValue({
        user: { email: 'test@example.com' },
        tenants: ['tenant1', 'tenant2', 'tenant3'],
      });

      const result = await validateTenantAccess('tenant2');

      expect(result.isValid).toBe(true);
      expect(result.userTenants).toEqual(['tenant1', 'tenant2', 'tenant3']);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid when user does not have access to tenant', async () => {
      (auth as any).mockResolvedValue({
        user: { email: 'test@example.com' },
        tenants: ['tenant1', 'tenant3'],
      });

      const result = await validateTenantAccess('tenant2');

      expect(result.isValid).toBe(false);
      expect(result.userTenants).toEqual(['tenant1', 'tenant3']);
      expect(result.error).toBe('Access denied for tenant: tenant2');
    });

    it('should return invalid when session has no tenants', async () => {
      (auth as any).mockResolvedValue({
        user: { email: 'test@example.com' },
        // No tenants property
      });

      const result = await validateTenantAccess('tenant1');

      expect(result.isValid).toBe(false);
      expect(result.userTenants).toEqual([]);
      expect(result.error).toBe('No tenant access found in session');
    });

    it('should handle auth errors gracefully', async () => {
      (auth as any).mockRejectedValue(new Error('Auth failed'));

      const result = await validateTenantAccess('tenant1');

      expect(result.isValid).toBe(false);
      expect(result.userTenants).toEqual([]);
      expect(result.error).toBe('Failed to validate tenant access');
    });
  });

  describe('getUserTenants', () => {
    it('should return user tenants from session', async () => {
      (auth as any).mockResolvedValue({
        user: { email: 'test@example.com' },
        tenants: ['tenant1', 'tenant2'],
      });

      const result = await getUserTenants();

      expect(result).toEqual(['tenant1', 'tenant2']);
    });

    it('should return empty array when no tenants in session', async () => {
      (auth as any).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      const result = await getUserTenants();

      expect(result).toEqual([]);
    });

    it('should return empty array on auth error', async () => {
      (auth as any).mockRejectedValue(new Error('Auth failed'));

      const result = await getUserTenants();

      expect(result).toEqual([]);
    });
  });
});
