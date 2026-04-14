import { useMemo } from 'react';
import { JSONSchema7 } from 'json-schema';

import { useUserTenants } from '@/app/contexts/TenantContext';
import { getTenantFieldKey } from '@/utils/tenantField';

/**
 * A reusable hook that takes a base JSON schema and injects the list of
 * tenants from the global TenantContext.
 * @param baseSchema The static base JSON schema to modify.
 * @param baseUiSchema Optional UI schema to modify.
 * @returns An object containing the dynamically updated schema and a loading state.
 */
type UiGridRow = Record<string, unknown>;
type UiSchemaLike = {
  'ui:grid'?: UiGridRow[];
  [key: string]: unknown;
};

export const useTenants = (
  baseSchema: JSONSchema7,
  baseUiSchema?: UiSchemaLike
) => {
  const { tenants, isLoading } = useUserTenants();
  const tenantFieldKey = getTenantFieldKey();

  const { dynamicSchema, dynamicUiSchema } = useMemo(() => {
    // Create deep copies to avoid mutating the original objects
    const newSchema = JSON.parse(JSON.stringify(baseSchema));
    const newUiSchema: UiSchemaLike | undefined = baseUiSchema
      ? JSON.parse(JSON.stringify(baseUiSchema))
      : undefined;

    if (!tenants || tenants.length === 0) {
      if (newSchema.properties?.[tenantFieldKey]) {
        delete newSchema.properties[tenantFieldKey];
      }

      if (newUiSchema?.[tenantFieldKey]) {
        delete newUiSchema[tenantFieldKey];
      }

      const grid = newUiSchema?.['ui:grid'];
      if (newUiSchema && grid && grid.length > 0) {
        newUiSchema['ui:grid'] = grid
          .map((item: UiGridRow) => {
            const updatedItem = { ...item };
            delete updatedItem[tenantFieldKey];
            return updatedItem;
          })
          .filter((item: UiGridRow) => Object.keys(item).length > 0);
      }
    } else {
      if (!newSchema.properties) {
        newSchema.properties = {};
      }

      // Always inject tenant dynamically using env-based prefixed key.
      newSchema.properties[tenantFieldKey] = {
        type: 'string',
        title: 'Tenants',
        enum: tenants,
      };

      if (newUiSchema && !newUiSchema[tenantFieldKey]) {
        newUiSchema[tenantFieldKey] = {
          classNames: 'tenants-field',
          'ui:help': 'Optional tenant allowed to access this item.',
        };
      }

      const grid = newUiSchema?.['ui:grid'];
      if (newUiSchema && grid && grid.length > 0) {
        const hasTenantField = grid.some((item: UiGridRow) =>
          Object.prototype.hasOwnProperty.call(item, tenantFieldKey)
        );
        newUiSchema['ui:grid'] = hasTenantField
          ? grid
          : [{ [tenantFieldKey]: 24 }, ...grid];
      }
    }

    return {
      dynamicSchema: newSchema,
      dynamicUiSchema: newUiSchema,
    };
  }, [baseSchema, baseUiSchema, tenantFieldKey, tenants]);

  return {
    schema: dynamicSchema,
    uiSchema: dynamicUiSchema,
    isLoading,
  };
};
