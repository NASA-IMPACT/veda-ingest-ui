import CreatePR from '@/utils/githubUtils/CreatePR';
import UpdatePR from '@/utils/githubUtils/UpdatePR';
import { NextRequest, NextResponse } from 'next/server';

type AllowedIngestionType = 'dataset' | 'collection';

export async function POST(request: NextRequest) {
  try {
    const { data, ingestionType, userComment } = await request.json();

    if (!data) {
      return NextResponse.json(
        { error: 'Missing "data" field in the request body.' },
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

    const validatedIngestionType: AllowedIngestionType = ingestionType;

    const githubResponse = await CreatePR(
      data,
      validatedIngestionType,
      userComment
    );

    return NextResponse.json({ githubURL: githubResponse });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.log(error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const requiredFields = ['gitRef', 'fileSha', 'filePath', 'formData'];

    // Check for missing fields
    const missingFields = requiredFields.filter((field) => !(field in body));

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const { gitRef, fileSha, filePath, formData } = body;

    await UpdatePR(gitRef, fileSha, filePath, formData);

    return NextResponse.json(
      { message: 'Data updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      console.log(error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  }
}
