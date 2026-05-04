import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/authorization/withPermission';
import { getUserTenants } from '@/lib/serverTenantValidation';
import {
  createRequestLogContext,
  logRequestEnd,
  logRequestError,
  logRequestStart,
} from '@/lib/structuredLogger';
import { getTenantFieldKey } from '@/utils/tenantField';

import ListPRs from '@/utils/githubUtils/ListPRs';

type IngestionType = 'collection' | 'dataset';

export const GET = withPermission(
  (capabilities) => capabilities.canEditIngest,
  async (request: NextRequest, _context, session) => {
    const logContext = createRequestLogContext(request, '/api/list-ingests');
    logRequestStart(logContext);

    try {
      const userTenants = await getUserTenants(session);

      const searchParams = request.nextUrl.searchParams;
      const ingestionType = searchParams.get('ingestionType') as IngestionType;
      if (!ingestionType) {
        logRequestEnd(logContext, 400, { reason: 'missing_ingestion_type' });
        return NextResponse.json(
          { error: 'ingestionType parameter is required' },
          { status: 400 }
        );
      }

      const allIngests = await ListPRs(ingestionType);

      const tenantFieldKey = getTenantFieldKey();

      const filteredIngests = allIngests.filter((ingest) => {
        const fileTenant = ingest.tenant;

        if (!fileTenant || fileTenant === '') {
          return true;
        }

        return userTenants.includes(fileTenant);
      });

      const tenantKeyedIngests = filteredIngests.map((ingest) => {
        const ingestRecord = ingest as unknown as Record<string, unknown>;
        const tenant = ingestRecord.tenant;

        if (typeof tenant !== 'string') {
          return ingestRecord;
        }

        const { tenant: _tenant, ...rest } = ingestRecord;
        void _tenant;
        return {
          ...rest,
          [tenantFieldKey]: tenant,
        };
      });

      logRequestEnd(logContext, 200, {
        ingestionType,
        resultCount: tenantKeyedIngests.length,
      });
      return NextResponse.json({ githubResponse: tenantKeyedIngests });
    } catch (error) {
      if (error instanceof Error) {
        logRequestError(logContext, error, { status: 400 });
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      logRequestError(logContext, error, { status: 500 });
      return NextResponse.json(
        { error: 'An unexpected error occurred on the server.' },
        { status: 500 }
      );
    }
  },
  { unauthenticatedMessage: 'Unauthorized' }
);
