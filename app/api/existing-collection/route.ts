import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserTenants } from '@/lib/serverTenantValidation';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's allowed tenants
    const userTenants = await getUserTenants(session);

    const { searchParams } = new URL(request.url);
    const tenantFilter = searchParams.get('tenant');

    // Validate that if a tenant filter is specified, the user has access to it
    if (
      tenantFilter &&
      tenantFilter !== 'Public' &&
      !userTenants.includes(tenantFilter)
    ) {
      return NextResponse.json(
        { error: `Access denied for tenant: ${tenantFilter}` },
        { status: 403 }
      );
    }

    let stacUrl = 'https://staging.openveda.cloud/api/stac/collections';
    if (tenantFilter) {
      stacUrl += `?tenant=${encodeURIComponent(tenantFilter)}`;
    }

    // Fetch from STAC API
    const stacResponse = await fetch(stacUrl);
    if (!stacResponse.ok) {
      const errorText = await stacResponse.text();
      return NextResponse.json(
        { error: `STAC API error: ${errorText}` },
        { status: stacResponse.status }
      );
    }

    const stacData = await stacResponse.json();

    // Filter collections by user's allowed tenants if no specific tenant filter
    if (!tenantFilter && stacData.collections) {
      stacData.collections = stacData.collections.filter((collection: any) => {
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

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { formData } = body;

    if (!formData || typeof formData !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid formData' },
        { status: 400 }
      );
    }
    // TODO:  For now, just mock a success response
    console.log({ formData });
    return NextResponse.json(
      { message: 'Existing collection updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating collection:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
