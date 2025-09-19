import { NextRequest, NextResponse } from 'next/server';

import ListPRs from '@/utils/githubUtils/ListPRs';

type IngestionType = 'collection' | 'dataset';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ingestionType = searchParams.get('ingestionType') as IngestionType;

    const githubResponse = await ListPRs(ingestionType);
    return NextResponse.json({ githubResponse });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.error('An unexpected error occurred:', error);
      return NextResponse.json(
        { error: 'An unexpected error occurred on the server.' },
        { status: 500 }
      );
    }
  }
}
