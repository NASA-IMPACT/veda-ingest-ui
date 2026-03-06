import { useMemo } from 'react';
import { JSONSchema7 } from 'json-schema';

import { useUserTenants } from '@/app/contexts/TenantContext';

/**
 * A reusable hook that takes a base JSON schema and injects the list of
 * tenants from the global TenantContext.
 * @param baseSchema The static base JSON schema to modify.
 * @param baseUiSchema Optional UI schema to modify.
 * @returns An object containing the dynamically updated schema and a loading state.
 */
export const useTenants = (baseSchema: JSONSchema7, baseUiSchema?: any) => {
  const { tenants, isLoading } = useUserTenants();

  const { dynamicSchema, dynamicUiSchema } = useMemo(() => {
    // Create deep copies to avoid mutating the original objects
    const newSchema = JSON.parse(JSON.stringify(baseSchema));
    const newUiSchema = baseUiSchema
      ? JSON.parse(JSON.stringify(baseUiSchema))
      : undefined;

    if (!tenants || tenants.length === 0) {
      if (newSchema.properties?.tenant) {
        delete newSchema.properties.tenant;
      }

      if (newUiSchema?.['ui:grid']?.length > 0) {
        newUiSchema['ui:grid'] = newUiSchema['ui:grid'].filter(
          (item: any) => !Object.keys(item).includes('tenant')
        );
      }
    } else {
      // Add tenant enum values to the schema (single string selection)
      if (newSchema.properties?.tenant) {
        const tenantProperty = newSchema.properties.tenant as JSONSchema7;
        tenantProperty.type = 'string';
        tenantProperty.enum = tenants;
      }
    }

    return {
      dynamicSchema: newSchema,
      dynamicUiSchema: newUiSchema,
    };
  }, [baseSchema, baseUiSchema, tenants]);

  return {
    schema: dynamicSchema,
    uiSchema: dynamicUiSchema,
    isLoading,
  };
};
