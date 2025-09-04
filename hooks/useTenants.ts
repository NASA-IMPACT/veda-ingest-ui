import { useMemo } from 'react';
import { JSONSchema7 } from 'json-schema';

import { useUserTenants } from '@/app/contexts/TenantContext';

/**
 * A reusable hook that takes a base JSON schema and injects the list of
 * tenants from the global TenantContext.
 * @param baseSchema The static base JSON schema to modify.
 * @returns An object containing the dynamically updated schema and a loading state.
 */
export const useTenants = (baseSchema: JSONSchema7) => {
  const { allowedTenants, isLoading } = useUserTenants();

  const dynamicSchema = useMemo(() => {
    // If tenants haven't loaded, return the base schema
    if (!allowedTenants) {
      return baseSchema;
    }

    // Create a deep copy to avoid mutating the original object
    const newSchema = JSON.parse(JSON.stringify(baseSchema));

    if (newSchema.properties && newSchema.properties.tenant) {
      const tenantProperty = newSchema.properties.tenant as JSONSchema7;
      if (tenantProperty.items && typeof tenantProperty.items === 'object') {
        (tenantProperty.items as JSONSchema7).enum = allowedTenants;
      }
    }

    return newSchema;
  }, [baseSchema, allowedTenants]);

  return { schema: dynamicSchema, isLoading };
};
