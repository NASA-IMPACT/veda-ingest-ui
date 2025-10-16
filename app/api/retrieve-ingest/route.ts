import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import RetrieveJSON from '@/utils/githubUtils/RetrieveJSON';

type IngestionType = 'collection' | 'dataset';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and scope for retrieve operations
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has the required scope to retrieve ingests for editing
    if (!session.scopes?.includes('dataset:update')) {
      return NextResponse.json(
        { error: 'Insufficient permissions: dataset:update scope required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get('ref');
    const ingestionType = searchParams.get('ingestionType') as IngestionType;

    if (!ref) {
      return NextResponse.json(
        { error: 'Missing required query parameter: "ref".' },
        { status: 400 }
      );
    }

    if (!ingestionType || !['dataset', 'collection'].includes(ingestionType)) {
      return NextResponse.json(
        {
          error:
            'Missing or invalid "ingestionType". Must be "dataset" or "collection".',
        },
        { status: 400 }
      );
    }

    const response = await RetrieveJSON(ref, ingestionType);
    const content = response?.content;

    if (!content || typeof content !== 'object') {
      return NextResponse.json(
        { error: 'Invalid file format. Expected a JSON object.' },
        { status: 400 }
      );
    }

    if (ingestionType === 'dataset') {
      const datasetContent = content as { collection?: unknown };
      if (
        typeof datasetContent.collection !== 'string' ||
        datasetContent.collection.trim() === ''
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid file format for dataset. Expected a JSON object with a non-empty "collection" key.',
          },
          { status: 400 }
        );
      }
    } else if (ingestionType === 'collection') {
      const collectionContent = content as { id?: unknown };
      if (
        typeof collectionContent.id !== 'string' ||
        collectionContent.id.trim() === ''
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid file format for collection. Expected a JSON object with a non-empty "id" key.',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(response);
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
