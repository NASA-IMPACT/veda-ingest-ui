import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { filename, filetype } = req.body;

  if (!filename || !filetype) {
    return res.status(400).json({ error: 'Missing filename or filetype' });
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: `uploads/${filename}`,
    Expires: 60, // URL expires in 60 seconds
    ContentType: filetype,
    ACL: 'public-read',
  };

  try {
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/uploads/${filename}`;
    res.status(200).json({ uploadUrl, fileUrl });
  } catch (error) {
    console.error('Error generating presigned URL', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}
