import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateTenantAccess } from '@/lib/serverTenantValidation';

interface RouteParams {
  params: Promise<{
    collectionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if the Edit Existing Collection feature is enabled
    if (process.env.ENABLE_EXISTING_COLLECTION_EDIT !== 'true') {
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

    const stacUrl = `https://staging.openveda.cloud/api/stac/collections/${encodeURIComponent(collectionId)}`;
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
    // Check if the Edit Existing Collection feature is enabled
    if (process.env.ENABLE_EXISTING_COLLECTION_EDIT !== 'true') {
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
    const stacUrl = `https://staging.openveda.cloud/api/stac/collections/${encodeURIComponent(collectionId)}`;
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
      return NextResponse.json(
        { error: `Failed to update collection: ${errorText}` },
        { status: updateResponse.status }
      );
    }

    const updatedCollection = await updateResponse.json();
    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    );
  }
}
