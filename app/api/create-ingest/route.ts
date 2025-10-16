import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateTenantAccess } from '@/lib/serverTenantValidation';

import CreatePR from '@/utils/githubUtils/CreatePR';
import UpdatePR from '@/utils/githubUtils/UpdatePR';

type AllowedIngestionType = 'dataset' | 'collection';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Input validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { data, ingestionType, userComment } = body;

    // Validate required fields
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid "data" field in the request body.' },
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

    // Validate userComment if provided
    if (userComment !== undefined && typeof userComment !== 'string') {
      return NextResponse.json(
        { error: 'Invalid "userComment" field. Must be a string.' },
        { status: 400 }
      );
    }

    const validatedIngestionType: AllowedIngestionType = ingestionType;

    if (data.tenant) {
      const session = await auth();
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required for tenant-specific requests' },
          { status: 401 }
        );
      }

      const tenantValidation = await validateTenantAccess(data.tenant, request);
      if (!tenantValidation.isValid) {
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

    if (formData?.tenant) {
      const session = await auth();
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required for tenant-specific updates' },
          { status: 401 }
        );
      }

      const tenantValidation = await validateTenantAccess(
        formData.tenant,
        request
      );
      if (!tenantValidation.isValid) {
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
