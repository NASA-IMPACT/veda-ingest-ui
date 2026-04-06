import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserTenants } from '@/lib/serverTenantValidation';
import { VEDA_PROD_BACKEND_URL } from '@/config/env';

type StacCollection = {
  tenant?: string;
  [key: string]: unknown;
};

type StacCollectionsResponse = {
  collections?: StacCollection[];
  [key: string]: unknown;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!session.scopes?.includes('stac:collection:update')) {
      return NextResponse.json(
        {
          error:
            'Insufficient permissions: stac:collection:update scope required',
        },
        { status: 403 }
      );
    }

    // Get user's allowed tenants
    const userTenants = await getUserTenants(session);

    const { searchParams } = new URL(request.url);
    const tenantFilter = searchParams.get('tenant');
    const normalizedTenantFilter = tenantFilter?.trim();
    const isPublicFilter = normalizedTenantFilter?.toLowerCase() === 'public';
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    // Validate that if a tenant filter is specified, the user has access to it
    if (
      normalizedTenantFilter &&
      !isPublicFilter &&
      !userTenants.includes(normalizedTenantFilter)
    ) {
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

    // Fetch from STAC API
    const stacResponse = await fetch(stacUrl);
    if (!stacResponse.ok) {
      const errorText = await stacResponse.text();
      return NextResponse.json(
        { error: `STAC API error: ${errorText}` },
        { status: stacResponse.status }
      );
    }

    const stacData = (await stacResponse.json()) as StacCollectionsResponse;

    if (isPublicFilter && stacData.collections) {
      stacData.collections = stacData.collections.filter((collection) => {
        const collectionTenant = collection.tenant?.toLowerCase?.();
        return (
          !collection.tenant ||
          collection.tenant === '' ||
          collectionTenant === 'public'
        );
      });
    }

    // Filter collections by user's allowed tenants if no specific tenant filter
    if (!normalizedTenantFilter && stacData.collections) {
      stacData.collections = stacData.collections.filter((collection) => {
        // Allow public collections (no tenant property or empty tenant)
        if (!collection.tenant || collection.tenant === '') {
          return true;
        }
        return userTenants.includes(collection.tenant);
      });
    }

    return NextResponse.json(stacData);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}
