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

const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!;

export async function checkFileExists(filename: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: filename }));
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 403) {
      return false;
    }
    throw new Error('Failed to check file existence');
  }
}

export async function generateSignedUrl(
  filename: string,
  filetype: string
): Promise<string> {
  const url = parseUrl(
    `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`
  );

  const signedUrlObject = await presigner.presign(
    new HttpRequest({
      ...url,
      method: 'PUT',
      headers: { 'Content-Type': filetype },
    })
  );

  return formatUrl(signedUrlObject);
}
