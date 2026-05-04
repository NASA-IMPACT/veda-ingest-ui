import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/authorization/withPermission';

import { checkFileExists, generateSignedUrl } from '@/utils/s3';
import {
  createRequestLogContext,
  logRequestEnd,
  logRequestError,
  logRequestStart,
} from '@/lib/structuredLogger';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png'];

export const POST = withPermission(
  (capabilities) => capabilities.canCreateIngest,
  async (req: NextRequest) => {
    const logContext = createRequestLogContext(req, '/api/upload-url');
    logRequestStart(logContext);

    try {
      const { NEXT_PUBLIC_AWS_S3_BUCKET_NAME: bucketName, AWS_REGION } =
        await import('@/config/env').then((m) => m.cfg);

      const { filename, filetype } = await req.json();

      if (!filename || !filetype) {
        logRequestEnd(logContext, 400, {
          reason: 'missing_filename_or_filetype',
        });
        return NextResponse.json(
          { error: 'Missing filename or filetype' },
          { status: 400 }
        );
      }

      if (!ALLOWED_FILE_TYPES.includes(filetype)) {
        logRequestEnd(logContext, 400, {
          reason: 'invalid_file_type',
          filetype,
        });
        return NextResponse.json(
          { error: 'Invalid file type. Only JPG and PNG are allowed.' },
          { status: 400 }
        );
      }

      let fileExists;
      try {
        fileExists = await checkFileExists(filename);
      } catch (error) {
        logRequestError(logContext, error, {
          status: 500,
          reason: 'check_file_exists_failed',
        });
        return NextResponse.json(
          { error: 'Failed to check file existence' },
          { status: 500 }
        );
      }

      let signedUrl;
      try {
        signedUrl = await generateSignedUrl(filename, filetype);
      } catch (error) {
        logRequestError(logContext, error, {
          status: 500,
          reason: 'generate_signed_url_failed',
        });
        return NextResponse.json(
          { error: 'Failed to generate upload URL' },
          { status: 500 }
        );
      }

      logRequestEnd(logContext, 200, {
        fileExists,
      });

      return NextResponse.json({
        uploadUrl: signedUrl,
        fileUrl: `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${filename}`,
        fileExists,
      });
    } catch (error) {
      logRequestError(logContext, error, { status: 500 });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
