import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTenants } from '../../hooks/useTenants';
import { JSONSchema7 } from 'json-schema';

vi.mock('@/app/contexts/TenantContext', () => ({
  useUserTenants: vi.fn(),
}));

import { useUserTenants } from '@/app/contexts/TenantContext';
import type { Mock } from 'vitest';
const mockedUseUserTenants = useUserTenants as Mock;

const baseSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    tenant: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
};

describe('useTenants', () => {
  mockedUseUserTenants.mockReturnValue({
    allowedTenants: undefined,
    isLoading: true,
  });
  const { result } = renderHook(() => useTenants(baseSchema));
  expect(result.current.schema).toEqual(baseSchema);
  expect(result.current.isLoading).toBe(true);

  it('should return the updated schema when the context has loaded', () => {
    const mockTenants = ['tenant-A', 'tenant-B'];

    const mockContextValue = {
      allowedTenants: mockTenants,
      isLoading: false,
    };
    mockedUseUserTenants.mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useTenants(baseSchema));
    expect(result.current.schema.properties?.tenant?.items?.enum).toEqual(
      mockTenants
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('should return the base schema while the context is loading', () => {
    const mockTenants = ['tenant-A'];
    const mockContextValue = {
      allowedTenants: mockTenants,
      isLoading: true,
    };
    mockedUseUserTenants.mockReturnValue(mockContextValue);
    const baseSchemaCopy = JSON.parse(JSON.stringify(baseSchema));
    renderHook(() => useTenants(baseSchemaCopy));
    expect(baseSchemaCopy.properties?.tenant?.items?.enum).toBeUndefined();
  });
});
