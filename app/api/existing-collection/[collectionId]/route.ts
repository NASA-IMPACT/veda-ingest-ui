import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { validateTenantAccess } from '@/lib/serverTenantValidation';
import { VEDA_BACKEND_URL } from '@/config/env';

const isAllowedAppEnv = () => {
  const env = process.env.NEXT_PUBLIC_APP_ENV?.toLowerCase();
  return env === 'veda' || env === 'local';
};

interface RouteParams {
  params: Promise<{
    collectionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isAllowedAppEnv()) {
      return NextResponse.json(
        { error: 'Edit Existing Collection feature is disabled' },
        { status: 403 }
      );
    }

    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { collectionId } = await params;

    const stacUrl = `${VEDA_BACKEND_URL}/stac/collections/${encodeURIComponent(collectionId)}`;
    const stacResponse = await fetch(stacUrl, {
      headers: {
        Authorization: `Bearer ${(session as any).accessToken}`,
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Incremental rollout: API access is allowed only for the VEDA and local environments.
    if (!isAllowedAppEnv()) {
      return NextResponse.json(
        { error: 'Edit Existing Collection feature is disabled' },
        { status: 403 }
      );
    }

    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { collectionId } = await params;
    const formData = await request.json();

    // First, get the existing collection to check tenant access
    const stacUrl = `${VEDA_BACKEND_URL}/stac/collections/${encodeURIComponent(collectionId)}`;
    const existingResponse = await fetch(stacUrl, {
      headers: {
        Authorization: `Bearer ${(session as any).accessToken}`,
      },
    });

    if (!existingResponse.ok) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const existingCollection = await existingResponse.json();

    // Validate tenant access if collection has a tenant
    if (
      existingCollection.tenant &&
      existingCollection.tenant !== '' &&
      existingCollection.tenant !== 'Public'
    ) {
      const tenantValidation = await validateTenantAccess(
        existingCollection.tenant,
        session
      );

      if (!tenantValidation.isValid) {
        return NextResponse.json(
          {
            error: `Access denied for collection from tenant: ${existingCollection.tenant}`,
          },
          { status: 403 }
        );
      }
    }

    const updateResponse = await fetch(stacUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(session as any).accessToken}`,
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
