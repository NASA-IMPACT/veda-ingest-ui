import { cfg } from '@/config/env';

const DEFAULT_TENANT_FIELD_KEY = 'eic:tenant';

export const getTenantFieldKey = () => {
  const configuredKey = cfg.VEDA_TENANT_FILTER_FIELD?.trim();
  return configuredKey && configuredKey.length > 0
    ? configuredKey
    : DEFAULT_TENANT_FIELD_KEY;
};