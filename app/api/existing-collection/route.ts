import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/authorization/withPermission';
import { getUserTenants } from '@/lib/serverTenantValidation';
import {
  createRequestLogContext,
  logRequestEnd,
  logRequestError,
  logRequestStart,
} from '@/lib/structuredLogger';
import { VEDA_PROD_BACKEND_URL } from '@/config/env';
import { getTenantFieldKey } from '@/utils/tenantField';

type StacCollection = {
  [key: string]: unknown;
};

type StacCollectionsResponse = {
  collections?: StacCollection[];
  [key: string]: unknown;
};

export const GET = withPermission(
  (capabilities) => capabilities.canEditExistingCollection,
  async (request: NextRequest, _context, session) => {
    const logContext = createRequestLogContext(
      request,
      '/api/existing-collection'
    );
    logRequestStart(logContext);

    try {
      const userTenants = await getUserTenants(session);

      const tenantFieldKey = getTenantFieldKey();
      const getCollectionTenant = (
        collection: StacCollection
      ): string | undefined => {
        const tenant = collection[tenantFieldKey];
        return typeof tenant === 'string' ? tenant : undefined;
      };

      const { searchParams } = new URL(request.url);
      const tenantFilter = searchParams.get('tenant');
      const normalizedTenantFilter = tenantFilter?.trim();
      const isPublicFilter = normalizedTenantFilter?.toLowerCase() === 'public';
      const q = searchParams.get('q');
      const limit = searchParams.get('limit') || '10';
      const offset = searchParams.get('offset') || '0';

      if (
        normalizedTenantFilter &&
        !isPublicFilter &&
        !userTenants.includes(normalizedTenantFilter)
      ) {
        logRequestEnd(logContext, 403, {
          reason: 'tenant_filter_access_denied',
          tenant: normalizedTenantFilter,
        });
        return NextResponse.json(
          { error: `Access denied for tenant: ${normalizedTenantFilter}` },
          { status: 403 }
        );
      }

      const stacSearchParams = new URLSearchParams({
        limit,
        offset,
      });

      if (q) {
        stacSearchParams.set('q', q);
      }

      if (normalizedTenantFilter && !isPublicFilter) {
        stacSearchParams.set('tenant', normalizedTenantFilter);
      }

      const stacUrl = `${VEDA_PROD_BACKEND_URL}/stac/collections?${stacSearchParams.toString()}`;

      const stacResponse = await fetch(stacUrl);
      if (!stacResponse.ok) {
        const errorText = await stacResponse.text();
        logRequestEnd(logContext, stacResponse.status, {
          reason: 'downstream_stac_error',
          downstreamStatus: stacResponse.status,
        });
        return NextResponse.json(
          { error: `STAC API error: ${errorText}` },
          { status: stacResponse.status }
        );
      }

      const stacData = (await stacResponse.json()) as StacCollectionsResponse;

      if (isPublicFilter && stacData.collections) {
        stacData.collections = stacData.collections.filter((collection) => {
          const tenant = getCollectionTenant(collection);
          const collectionTenant = tenant?.toLowerCase();
          return !tenant || tenant === '' || collectionTenant === 'public';
        });
      }

      if (!normalizedTenantFilter && stacData.collections) {
        stacData.collections = stacData.collections.filter((collection) => {
          const tenant = getCollectionTenant(collection);
          if (!tenant || tenant === '' || tenant.toLowerCase() === 'public') {
            return true;
          }
          return userTenants.includes(tenant);
        });
      }

      logRequestEnd(logContext, 200, {
        tenantFilter: normalizedTenantFilter ?? null,
        resultCount: Array.isArray(stacData.collections)
          ? stacData.collections.length
          : 0,
      });
      return NextResponse.json(stacData);
    } catch (error) {
      logRequestError(logContext, error, { status: 500 });
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      );
    }
  }
);
