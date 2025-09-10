import { NextRequest, NextResponse } from 'next/server';
import ListPRs from '@/utils/githubUtils/ListPRs';
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
      const fileTenants = ingest.tenants as string[] | undefined;

      // Condition 1: If the ingest has no 'tenants' array, it's public and should be shown.
      if (!fileTenants || fileTenants.length === 0) {
        return true;
      }

      // Condition 2: If the ingest has tenants, show it only if the user's tenants match.
      return fileTenants.every((fileTenant) =>
        userTenants.includes(fileTenant)
      );
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
