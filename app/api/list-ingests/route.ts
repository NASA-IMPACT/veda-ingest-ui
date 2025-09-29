import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import ListPRs from '@/utils/githubUtils/ListPRs';

type IngestionType = 'collection' | 'dataset';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userTenants = session.tenants || [];

    const searchParams = request.nextUrl.searchParams;
    const ingestionType = searchParams.get('ingestionType') as IngestionType;
    if (!ingestionType) {
      return NextResponse.json(
        { error: 'ingestionType parameter is required' },
        { status: 400 }
      );
    }

    const allIngests = await ListPRs(ingestionType);

    const filteredIngests = allIngests.filter((ingest) => {
      const fileTenant = ingest.tenant;

      // Condition 1: If the ingest has no tenant, it's public and should be shown.
      if (!fileTenant || fileTenant === '') {
        return true;
      }

      // Condition 2: If the ingest has a tenant, show it only if the user has access to that tenant.
      return userTenants.includes(fileTenant);
    });

    return NextResponse.json({ githubResponse: filteredIngests });
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
}
