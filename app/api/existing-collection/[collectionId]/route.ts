import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateTenantAccess } from '@/lib/serverTenantValidation';

interface RouteParams {
  params: {
    collectionId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { collectionId } = await params;

    const stacUrl = `https://staging.openveda.cloud/api/stac/collections/${encodeURIComponent(collectionId)}`;
    const stacResponse = await fetch(stacUrl);

    if (!stacResponse.ok) {
      const errorText = await stacResponse.text();
      return NextResponse.json(
        { error: `Collection not found: ${errorText}` },
        { status: stacResponse.status }
      );
    }

    const collectionData = await stacResponse.json();

    // Validate tenant access if collection has a tenant
    if (
      collectionData.tenant &&
      collectionData.tenant !== '' &&
      collectionData.tenant !== 'Public'
    ) {
      const tenantValidation = await validateTenantAccess(
        collectionData.tenant,
        session
      );

      if (!tenantValidation.isValid) {
        return NextResponse.json(
          {
            error: `Access denied for collection from tenant: ${collectionData.tenant}`,
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(collectionData);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}
