import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { validateTenantAccess } from '@/lib/serverTenantValidation';
import {
  createRequestLogContext,
  logRequestEnd,
  logRequestError,
  logRequestStart,
  summarizeSession,
} from '@/lib/structuredLogger';
import { VEDA_PROD_BACKEND_URL } from '@/config/env';
import { getTenantFieldKey } from '@/utils/tenantField';

interface RouteParams {
  params: Promise<{
    collectionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const logContext = createRequestLogContext(
    request,
    '/api/existing-collection/[collectionId]'
  );
  logRequestStart(logContext);

  try {
    const tenantFieldKey = getTenantFieldKey();

    const session = await auth();
    if (!session) {
      logRequestEnd(logContext, 401, { reason: 'missing_session' });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = (session as { accessToken?: string }).accessToken;

    if (!session.scopes?.includes('stac:collection:update')) {
      logRequestEnd(logContext, 403, {
        reason: 'missing_scope_stac_collection_update',
        ...summarizeSession(session),
      });
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
      logRequestEnd(logContext, stacResponse.status, {
        reason: 'downstream_collection_fetch_failed',
        collectionId,
      });
      return NextResponse.json(
        { error: `Collection not found: ${errorText}` },
        { status: stacResponse.status }
      );
    }

    const collectionData = await stacResponse.json();
    const collectionTenantValue = collectionData?.[tenantFieldKey];
    const collectionTenant =
      typeof collectionTenantValue === 'string'
        ? collectionTenantValue
        : undefined;

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
        logRequestEnd(logContext, 403, {
          reason: 'tenant_access_denied',
          tenant: collectionTenant,
          collectionId,
        });
        return NextResponse.json(
          {
            error: `Access denied for collection from tenant: ${collectionTenant}`,
          },
          { status: 403 }
        );
      }
    }

    logRequestEnd(logContext, 200, { collectionId });
    return NextResponse.json(collectionData);
  } catch (error) {
    logRequestError(logContext, error, { status: 500 });
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const logContext = createRequestLogContext(
    request,
    '/api/existing-collection/[collectionId]'
  );
  logRequestStart(logContext);

  try {
    const tenantFieldKey = getTenantFieldKey();

    const session = await auth();
    if (!session) {
      logRequestEnd(logContext, 401, { reason: 'missing_session' });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = (session as { accessToken?: string }).accessToken;

    if (!session.scopes?.includes('stac:collection:update')) {
      logRequestEnd(logContext, 403, {
        reason: 'missing_scope_stac_collection_update',
        ...summarizeSession(session),
      });
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
      logRequestEnd(logContext, 404, {
        reason: 'existing_collection_not_found',
        collectionId,
      });
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
        logRequestEnd(logContext, 403, {
          reason: 'tenant_access_denied',
          tenant: existingTenant,
          collectionId,
        });
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
      logRequestEnd(logContext, updateResponse.status, {
        reason: 'downstream_collection_put_failed',
        collectionId,
        downstreamStatus: updateResponse.status,
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
    logRequestEnd(logContext, 200, { collectionId });
    return NextResponse.json(updatedCollection);
  } catch (error) {
    logRequestError(logContext, error, { status: 500 });
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
