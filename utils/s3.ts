import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner';
import { HttpRequest } from '@smithy/protocol-http';
import { parseUrl } from '@smithy/url-parser';
import { formatUrl } from '@aws-sdk/util-format-url';
import { Hash } from '@smithy/hash-node';

const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!;
const region = process.env.AWS_REGION || 'us-west-2';
const RoleArn = process.env.ASSUME_ROLE_ARN;
const ExternalId = process.env.INGEST_UI_EXTERNAL_ID;
const timestamp = Date.now();

async function assumeRole() {
  const sts = new STSClient({ region });

  const roleParams = {
    RoleArn,
    RoleSessionName: `veda-ingest-ui-${timestamp}`,
    DurationSeconds: 900,
    ExternalId,
  };

  const command = new AssumeRoleCommand(roleParams);
  const response = await sts.send(command);

  if (
    !response.Credentials ||
    !response.Credentials.AccessKeyId ||
    !response.Credentials.SecretAccessKey ||
    !response.Credentials.SessionToken
  ) {
    throw new Error(
      'Failed to assume role: Missing credentials from STS response.'
    );
  }

  return {
    accessKeyId: response.Credentials.AccessKeyId,
    secretAccessKey: response.Credentials.SecretAccessKey,
    sessionToken: response.Credentials.SessionToken,
  };
}

async function createS3Client() {
  const credentials = await assumeRole();
  return new S3Client({
    region,
    credentials,
  });
}

async function createPresigner() {
  const credentials = await assumeRole();
  return new S3RequestPresigner({
    credentials,
    region,
    sha256: Hash.bind(null, 'sha256'),
  });
}

export async function checkFileExists(filename: string): Promise<boolean> {
  try {
    const s3 = await createS3Client();
    await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: filename }));
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 403) {
      return false;
    }
    console.error(error);
    throw new Error('Failed to check file existence');
  }
}

export async function generateSignedUrl(
  filename: string,
  filetype: string
): Promise<string> {
  const presigner = await createPresigner();
  const url = parseUrl(
    `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`
  );

  const signedUrlObject = await presigner.presign(
    new HttpRequest({
      ...url,
      method: 'PUT',
      headers: {
        'Content-Type': filetype,
      },
    })
  );

  return formatUrl(signedUrlObject);
}

export async function getSignedUrlForGetObject(
  key: string
): Promise<string | undefined> {
  try {
    const presigner = await createPresigner();
    const url = parseUrl(
      `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    );

    const signedUrlObject = await presigner.presign(
      new HttpRequest({
        ...url,
        method: 'GET',
      })
    );

    return formatUrl(signedUrlObject);
  } catch (error) {
    console.error('Error generating signed URL for GET object:', error);
    return undefined;
  }
}
