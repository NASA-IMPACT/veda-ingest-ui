import { NextRequest, NextResponse } from 'next/server';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner';
import { HttpRequest } from '@smithy/protocol-http';
import { parseUrl } from '@smithy/url-parser';
import { formatUrl } from '@aws-sdk/util-format-url';
import { Hash } from '@smithy/hash-node';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const presigner = new S3RequestPresigner({
  credentials: s3.config.credentials,
  region: process.env.AWS_REGION!,
  sha256: Hash.bind(null, 'sha256'),
});

export async function POST(req: NextRequest) {
  try {
    const { filename, filetype } = await req.json();

    if (!filename || !filetype) {
      return NextResponse.json(
        { error: 'Missing filename or filetype' },
        { status: 400 }
      );
    }

    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!;
    const key = filename;

    // 🔍 Check if the file already exists in S3
    let fileExists = false;
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
      fileExists = true;
    } catch (error: any) {
      if (error.name !== 'NotFound') {
        console.error('Error checking file existence:', error);
        return NextResponse.json(
          { error: 'Failed to check file existence' },
          { status: 500 }
        );
      }
    }

    const url = parseUrl(
      `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    );

    const signedUrlObject = await presigner.presign(
      new HttpRequest({
        ...url,
        method: 'PUT',
        headers: { 'Content-Type': filetype },
      })
    );

    const signedUrl = formatUrl(signedUrlObject);

    return NextResponse.json({
      uploadUrl: signedUrl,
      fileUrl: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      fileExists,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
