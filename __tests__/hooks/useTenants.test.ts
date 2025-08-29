import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { JSONSchema7 } from 'json-schema';

import { useTenants } from '@/hooks/useTenants';

const baseSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    tenant: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

describe('useTenants Hook Logic', () => {
  it('correctly updates the schema when it receives tenant data', async () => {
    const mockTenants = ['tenant-A', 'tenant-B'];

    const mockFetcher = vi.fn().mockResolvedValue(mockTenants);

    const { result } = renderHook(() => useTenants(baseSchema, mockFetcher));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const expectedSchema = JSON.parse(JSON.stringify(baseSchema));
    (expectedSchema.properties.tenant.items as JSONSchema7).enum = mockTenants;

    expect(result.current.schema).toEqual(expectedSchema);
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });
});
