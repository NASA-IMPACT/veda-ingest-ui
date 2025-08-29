import { useState, useEffect } from 'react';
import { JSONSchema7 } from 'json-schema';
import { fetchTenantsFromApi as defaultFetchTenants } from '@/lib/services/tenantService';

type TenantFetcher = () => Promise<string[]>;

export const useTenants = (
  baseSchema: JSONSchema7,
  // The dependency is now an argument with a default value
  fetcher: TenantFetcher = defaultFetchTenants
) => {
  const [schema, setSchema] = useState<JSONSchema7>(baseSchema);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const updateSchemaWithTenants = async () => {
      try {
        setIsLoading(true);
        const tenantEnums = await fetcher();

        const newSchema = JSON.parse(JSON.stringify(baseSchema));

        if (newSchema.properties && newSchema.properties.tenants) {
          const tenantProperty = newSchema.properties.tenants as JSONSchema7;
          if (
            tenantProperty.items &&
            typeof tenantProperty.items === 'object'
          ) {
            (tenantProperty.items as JSONSchema7).enum = tenantEnums;
          }
        }

        setSchema(newSchema);
      } catch (error) {
        console.error('Failed to fetch tenants and update schema:', error);
        setSchema(baseSchema);
      } finally {
        setIsLoading(false);
      }
    };

    updateSchemaWithTenants();
  }, [baseSchema, fetcher]);

  return { schema, isLoading };
};
