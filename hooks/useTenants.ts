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
  // 2. Get the tenants and loading state from the context
  const { allowedTenants, isLoading } = useUserTenants();

  // 3. Use useMemo to create the new schema.
  // This ensures the schema is only rebuilt when the base schema or the tenants change.
  const dynamicSchema = useMemo(() => {
    // If tenants haven't loaded yet, return the base schema
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
  }, [baseSchema, allowedTenants]); // Dependencies for the memo

  // 4. Return the new schema and the loading state from the context
  return { schema: dynamicSchema, isLoading };
};
