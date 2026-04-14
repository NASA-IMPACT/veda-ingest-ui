import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { validateTenantAccess } from '@/lib/serverTenantValidation';
import { VEDA_PROD_BACKEND_URL } from '@/config/env';
import { getTenantFieldKey } from '@/utils/tenantField';

interface RouteParams {
  params: Promise<{
    collectionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantFieldKey = getTenantFieldKey();

    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = (session as { accessToken?: string }).accessToken;

    if (!session.scopes?.includes('stac:collection:update')) {
      return NextResponse.json(
        {
          error:
            'Insufficient permissions: stac:collection:update scope required',
        },
        { status: 403 }
      );
    }

    const { collectionId } = await params;

    const stacUrl = `${VEDA_PROD_BACKEND_URL}/stac/collections/${encodeURIComponent(collectionId)}`;
    const stacResponse = await fetch(stacUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!stacResponse.ok) {
      const errorText = await stacResponse.text();
      return NextResponse.json(
        { error: `Collection not found: ${errorText}` },
        { status: stacResponse.status }
      );
    }

    const collectionData = await stacResponse.json();
    const collectionTenantValue = collectionData?.[tenantFieldKey];
    const collectionTenant =
      typeof collectionTenantValue === 'string' ? collectionTenantValue : undefined;

    // Validate tenant access if collection has a tenant
    if (
      collectionTenant &&
      collectionTenant !== '' &&
      collectionTenant.toLowerCase() !== 'public'
    ) {
      const tenantValidation = await validateTenantAccess(
        collectionTenant,
        session
      );

      if (!tenantValidation.isValid) {
        return NextResponse.json(
          {
            error: `Access denied for collection from tenant: ${collectionTenant}`,
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantFieldKey = getTenantFieldKey();

    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = (session as { accessToken?: string }).accessToken;

    if (!session.scopes?.includes('stac:collection:update')) {
      return NextResponse.json(
        {
          error:
            'Insufficient permissions: stac:collection:update scope required',
        },
        { status: 403 }
      );
    }

    const { collectionId } = await params;
    const formData = await request.json();

    // First, get the existing collection to check tenant access
    const stacUrl = `${VEDA_PROD_BACKEND_URL}/stac/collections/${encodeURIComponent(collectionId)}`;
    const existingResponse = await fetch(stacUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!existingResponse.ok) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const existingCollection = await existingResponse.json();
    const existingTenantValue = existingCollection?.[tenantFieldKey];
    const existingTenant =
      typeof existingTenantValue === 'string' ? existingTenantValue : undefined;

    // Validate tenant access if collection has a tenant
    if (
      existingTenant &&
      existingTenant !== '' &&
      existingTenant.toLowerCase() !== 'public'
    ) {
      const tenantValidation = await validateTenantAccess(
        existingTenant,
        session
      );

      if (!tenantValidation.isValid) {
        return NextResponse.json(
          {
            error: `Access denied for collection from tenant: ${existingTenant}`,
          },
          { status: 403 }
        );
      }
    }

    const updateResponse = await fetch(stacUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(formData),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Existing collection PUT failed', {
        collectionId,
        stacUrl,
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        responseBody: errorText,
      });
      return NextResponse.json(
        {
          error: `Failed to update collection: ${errorText}`,
          details: {
            collectionId,
            downstreamUrl: stacUrl,
            downstreamStatus: updateResponse.status,
            downstreamStatusText: updateResponse.statusText,
            downstreamResponseBody: errorText,
          },
        },
        { status: updateResponse.status }
      );
    }

    const updatedCollection = await updateResponse.json();
    console.info('Existing collection PUT succeeded', {
      collectionId,
      stacUrl,
      status: updateResponse.status,
    });
    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      {
        error: 'Failed to update collection',
        details: {
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
