import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/authorization/withPermission';
import {
  createRequestLogContext,
  logRequestEnd,
  logRequestError,
  logRequestStart,
} from '@/lib/structuredLogger';

import RetrieveJSON from '@/utils/githubUtils/RetrieveJSON';

type IngestionType = 'collection' | 'dataset';

export const GET = withPermission(
  (capabilities) => capabilities.canEditIngest,
  async (request: NextRequest) => {
    const logContext = createRequestLogContext(request, '/api/retrieve-ingest');
    logRequestStart(logContext);

    try {
      const searchParams = request.nextUrl.searchParams;
      const ref = searchParams.get('ref');
      const ingestionType = searchParams.get('ingestionType') as IngestionType;

      if (!ref) {
        logRequestEnd(logContext, 400, { reason: 'missing_ref' });
        return NextResponse.json(
          { error: 'Missing required query parameter: "ref".' },
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

      const response = await RetrieveJSON(ref, ingestionType);
      const content = response?.content;

      if (!content || typeof content !== 'object') {
        logRequestEnd(logContext, 400, { reason: 'invalid_file_content' });
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
          logRequestEnd(logContext, 400, { reason: 'invalid_dataset_content' });
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
          logRequestEnd(logContext, 400, {
            reason: 'invalid_collection_content',
          });
          return NextResponse.json(
            {
              error:
                'Invalid file format for collection. Expected a JSON object with a non-empty "id" key.',
            },
            { status: 400 }
          );
        }
      }

      logRequestEnd(logContext, 200, { ingestionType, ref });
      return NextResponse.json(response);
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
  }
);
