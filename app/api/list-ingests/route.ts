import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/authorization/withPermission';
import { getUserTenants } from '@/lib/serverTenantValidation';
import { getTenantFieldKey } from '@/utils/tenantField';

import ListPRs from '@/utils/githubUtils/ListPRs';

type IngestionType = 'collection' | 'dataset';

export const GET = withPermission(
  (capabilities) => capabilities.canEditIngest,
  async (request: NextRequest, _context, session) => {
    try {
      const userTenants = await getUserTenants(session);

      const searchParams = request.nextUrl.searchParams;
      const ingestionType = searchParams.get('ingestionType') as IngestionType;
      if (!ingestionType) {
        return NextResponse.json(
          { error: 'ingestionType parameter is required' },
          { status: 400 }
        );
      }

      const allIngests = await ListPRs(ingestionType);

      const tenantFieldKey = getTenantFieldKey();

      const filteredIngests = allIngests.filter((ingest) => {
        const fileTenant = ingest.tenant;

        // Condition 1: If the ingest has no tenant, it's public and should be shown.
        if (!fileTenant || fileTenant === '') {
          return true;
        }

        // Condition 2: If the ingest has a tenant, show it only if the user has access to that tenant.
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

      return NextResponse.json({ githubResponse: tenantKeyedIngests });
    } catch (error) {
      console.error('Error in /api/list-ingest:', error);
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json(
        { error: 'An unexpected error occurred on the server.' },
        { status: 500 }
      );
    }
  },
  { unauthenticatedMessage: 'Unauthorized' }
);
