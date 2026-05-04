import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/authorization/withPermission';
import { validateTenantAccess } from '@/lib/serverTenantValidation';
import {
  createRequestLogContext,
  logRequestEnd,
  logRequestError,
  logRequestStart,
  summarizeSession,
} from '@/lib/structuredLogger';
import { getTenantFieldKey } from '@/utils/tenantField';

import CreatePR from '@/utils/githubUtils/CreatePR';
import UpdatePR from '@/utils/githubUtils/UpdatePR';

type AllowedIngestionType = 'dataset' | 'collection';

export const POST = withPermission(
  (capabilities) => capabilities.canCreateIngest,
  async (request: NextRequest, _context, session) => {
    const logContext = createRequestLogContext(request, '/api/create-ingest');
    logRequestStart(logContext);

    try {
      const body = await request.json();

      if (!body || typeof body !== 'object') {
        logRequestEnd(logContext, 400, { reason: 'invalid_request_body' });
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }

      const { data, ingestionType, userComment } = body;

      if (!data || typeof data !== 'object') {
        logRequestEnd(logContext, 400, { reason: 'invalid_data_field' });
        return NextResponse.json(
          { error: 'Missing or invalid "data" field in the request body.' },
          { status: 400 }
        );
      }

      if (
        !ingestionType ||
        !['dataset', 'collection'].includes(ingestionType)
      ) {
        logRequestEnd(logContext, 400, { reason: 'invalid_ingestion_type' });
        return NextResponse.json(
          {
            error:
              'Missing or invalid "ingestionType". Must be "dataset" or "collection".',
          },
          { status: 400 }
        );
      }

      if (userComment !== undefined && typeof userComment !== 'string') {
        logRequestEnd(logContext, 400, { reason: 'invalid_user_comment' });
        return NextResponse.json(
          { error: 'Invalid "userComment" field. Must be a string.' },
          { status: 400 }
        );
      }

      const validatedIngestionType: AllowedIngestionType = ingestionType;

      const tenantFieldKey = getTenantFieldKey();
      const tenantValue = data[tenantFieldKey];
      const tenant = typeof tenantValue === 'string' ? tenantValue : undefined;

      if (tenant && tenant !== '' && tenant.toLowerCase() !== 'public') {
        const tenantValidation = await validateTenantAccess(tenant, session);
        if (!tenantValidation.isValid) {
          logRequestEnd(logContext, 403, {
            reason: 'tenant_access_denied',
            tenant,
            ...summarizeSession(session),
          });
          return NextResponse.json(
            {
              error:
                'Access denied: You do not have permission to create ingests for this tenant',
              details: tenantValidation.error,
            },
            { status: 403 }
          );
        }
      }

      const githubResponse = await CreatePR(
        data,
        validatedIngestionType,
        userComment
      );

      logRequestEnd(logContext, 200, {
        ingestionType: validatedIngestionType,
        tenant: tenant ?? 'Public',
      });
      return NextResponse.json({ githubURL: githubResponse });
    } catch (error) {
      if (error instanceof Error) {
        logRequestError(logContext, error, { status: 400 });
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      logRequestError(logContext, error, { status: 500 });
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  },
  { unauthenticatedMessage: 'Authentication required for create requests' }
);

export const PUT = withPermission(
  (capabilities) => capabilities.canEditIngest,
  async (request: NextRequest, _context, session) => {
    const logContext = createRequestLogContext(request, '/api/create-ingest');
    logRequestStart(logContext);

    try {
      const body = await request.json();

      const requiredFields = ['gitRef', 'fileSha', 'filePath', 'formData'];
      const missingFields = requiredFields.filter((field) => !(field in body));

      if (missingFields.length > 0) {
        logRequestEnd(logContext, 400, {
          reason: 'missing_required_fields',
          missingFieldCount: missingFields.length,
        });
        return NextResponse.json(
          { error: `Missing required fields: ${missingFields.join(', ')}` },
          { status: 400 }
        );
      }

      const { gitRef, fileSha, filePath, formData } = body;

      const tenantFieldKey = getTenantFieldKey();
      const tenantValue = formData?.[tenantFieldKey];
      const tenant = typeof tenantValue === 'string' ? tenantValue : undefined;

      if (tenant && tenant !== '' && tenant.toLowerCase() !== 'public') {
        const tenantValidation = await validateTenantAccess(tenant, session);
        if (!tenantValidation.isValid) {
          logRequestEnd(logContext, 403, {
            reason: 'tenant_access_denied',
            tenant,
            ...summarizeSession(session),
          });
          return NextResponse.json(
            {
              error:
                'Access denied: You do not have permission to update ingests for this tenant',
              details: tenantValidation.error,
            },
            { status: 403 }
          );
        }
      }

      await UpdatePR(gitRef, fileSha, filePath, formData);

      logRequestEnd(logContext, 200, {
        tenant: tenant ?? 'Public',
      });
      return NextResponse.json(
        { message: 'Data updated successfully' },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error) {
        logRequestError(logContext, error, { status: 400 });
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      logRequestError(logContext, error, { status: 500 });
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  },
  { unauthenticatedMessage: 'Authentication required for updates' }
);
