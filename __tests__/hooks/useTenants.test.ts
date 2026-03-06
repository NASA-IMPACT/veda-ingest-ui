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
      type: 'string',
    },
  },
};

describe('useTenants', () => {
  it('should remove tenant property when tenants is undefined and loading', () => {
    mockedUseUserTenants.mockReturnValue({
      tenants: undefined,
      isLoading: true,
    });
    const { result } = renderHook(() => useTenants(baseSchema));
    expect(result.current.schema).toEqual({
      type: 'object',
      properties: {},
    });
    expect(result.current.isLoading).toBe(true);
  });

  it('should return the updated schema when the context has loaded', () => {
    const mockTenants = ['tenant-A', 'tenant-B'];

    const mockContextValue = {
      tenants: mockTenants,
      isLoading: false,
    };
    mockedUseUserTenants.mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useTenants(baseSchema));
    expect(result.current.schema.properties?.tenant?.type).toBe('string');
    expect(result.current.schema.properties?.tenant?.enum).toEqual(mockTenants);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return the updated schema even while loading if tenants are available', () => {
    const mockTenants = ['tenant-A'];
    const mockContextValue = {
      tenants: mockTenants,
      isLoading: true,
    };
    mockedUseUserTenants.mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useTenants(baseSchema));
    expect(result.current.schema.properties?.tenant?.type).toBe('string');
    expect(result.current.schema.properties?.tenant?.enum).toEqual(mockTenants);
    expect(result.current.isLoading).toBe(true);
  });

  it('should remove tenant property if tenants is empty', () => {
    const mockContextValue = {
      tenants: [],
      isLoading: false,
    };
    mockedUseUserTenants.mockReturnValue(mockContextValue);

    const schemaWithTenant: JSONSchema7 = {
      type: 'object',
      properties: {
        tenant: {
          type: 'string',
          enum: ['testTenant'],
        },
        other: {
          type: 'string',
        },
      },
    };

    const { result } = renderHook(() => useTenants(schemaWithTenant));
    expect(result.current.schema.properties?.tenant).toBeUndefined();
    expect(result.current.schema.properties?.other).toBeDefined();
  });

  it('should remove tenant from ui:grid if tenants is empty', () => {
    const mockContextValue = {
      tenants: [],
      isLoading: false,
    };
    mockedUseUserTenants.mockReturnValue(mockContextValue);

    const baseUiSchema = {
      'ui:grid': [{ tenant: {} }, { other: {} }],
    };

    const { result } = renderHook(() => useTenants(baseSchema, baseUiSchema));
    expect(result.current.uiSchema['ui:grid']).toEqual([{ other: {} }]);
  });

  it('should not mutate the original baseSchema and baseUiSchema', () => {
    const mockContextValue = {
      tenants: ['tenant-X'],
      isLoading: false,
    };
    mockedUseUserTenants.mockReturnValue(mockContextValue);

    const schemaCopy = JSON.parse(JSON.stringify(baseSchema));
    const uiSchemaCopy = { 'ui:grid': [{ tenant: {} }] };

    renderHook(() => useTenants(schemaCopy, uiSchemaCopy));
    expect(schemaCopy).toEqual(baseSchema);
    expect(uiSchemaCopy).toEqual({ 'ui:grid': [{ tenant: {} }] });
  });
});
