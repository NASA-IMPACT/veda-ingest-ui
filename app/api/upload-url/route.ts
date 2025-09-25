import { NextRequest, NextResponse } from 'next/server';

import { checkFileExists, generateSignedUrl } from '@/utils/s3';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png'];

export async function POST(req: NextRequest) {
  try {
    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!;

    const { filename, filetype } = await req.json();

    if (!filename || !filetype) {
      return NextResponse.json(
        { error: 'Missing filename or filetype' },
        { status: 400 }
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(filetype)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG and PNG are allowed.' },
        { status: 400 }
      );
    }

    let fileExists;
    try {
      fileExists = await checkFileExists(filename);
    } catch (error) {
      console.error('Error checking file existence:', error);
      return NextResponse.json(
        { error: 'Failed to check file existence' },
        { status: 500 }
      );
    }

    let signedUrl;
    try {
      signedUrl = await generateSignedUrl(filename, filetype);
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return NextResponse.json(
        { error: 'Failed to generate upload URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      uploadUrl: signedUrl,
      fileUrl: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`,
      fileExists,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
