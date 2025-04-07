import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrlForGetObject } from '@/utils/s3';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'Missing S3 URL' }, { status: 400 });
    }

    const parsedUrl = new URL(url);
    const key = parsedUrl.pathname.substring(1);

    if (!key) {
      return NextResponse.json(
        { error: 'Could not extract object key from URL' },
        { status: 400 }
      );
    }

    let signedUrl: string | undefined;
    try {
      signedUrl = await getSignedUrlForGetObject(key);
      if (!signedUrl) {
        return NextResponse.json(
          { error: 'Failed to generate signed URL for GET' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error generating signed URL for GET:', error);
      return NextResponse.json(
        { error: 'Failed to generate signed URL for GET' },
        { status: 500 }
      );
    }

    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error('Unexpected error in /api/get-signed-url:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
