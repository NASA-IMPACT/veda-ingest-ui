'use client';

import AppLayout from '@/components/Layout';
import { Amplify } from 'aws-amplify';
import { config } from '@/utils/aws-exports';
import { SignInHeader } from '@/components/SignInHeader';
import { withConditionalAuthenticator } from '@/utils/withConditionalAuthenticator';
import type { UploadProps } from 'antd/es/upload/interface';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  List,
  message,
  Progress,
  Upload,
  Image,
  Statistic,
  Typography,
  Divider,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Title, Paragraph, Link } = Typography;

const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!;

interface UploadingFile {
  file: File;
  progress: number;
}

interface UploadedFile {
  name: string;
  url: string;
}

interface ImageValidationResult {
  width: number;
  height: number;
  aspectRatio: number;
  fileSizeKB: number;
  errors: string[];
}

Amplify.configure({ ...config }, { ssr: true });

function UploadPage() {
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(
    null
  );
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [imageValidation, setImageValidation] =
    useState<ImageValidationResult | null>(null);
  const [isRemovingErrors, setIsRemovingErrors] = useState(false);

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const aspectRatio = width / height;
        const fileSizeKB = Math.round(file.size / 1024);
        const maxSizeKB = 500;
        const errors: string[] = [];

        // Validation Conditions
        if (width < 2000 || height < 1000) {
          errors.push('Image must be at least 2000x1000 pixels.');
        }

        if (aspectRatio !== 2) {
          errors.push('Image must have an aspect ratio of 2:1.');
        }

        if (fileSizeKB > maxSizeKB) {
          errors.push('File size must be less than 500KB.');
        }

        setImageValidation({ width, height, aspectRatio, fileSizeKB, errors });
        resolve(errors.length === 0);
      };
      img.onerror = () => {
        setImageValidation({
          width: 0,
          height: 0,
          aspectRatio: 0,
          fileSizeKB: 0,
          errors: ['Failed to load image.'],
        });
        setUploadedFile(null);
        resolve(false);
      };
    });
  };

  const handleUpload = async ({ file, onProgress }: any) => {
    if (!(file instanceof File)) {
      message.error('Invalid file type');
      return;
    }

    // Validate Image Before Uploading
    const isValid = await validateImage(file);
    if (!isValid) return;

    setUploadingFile({ file, progress: 0 });

    try {
      // Request a presigned URL from API
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, filetype: file.type }),
      });

      if (!res.ok) throw new Error('Failed to get presigned URL');
      const { uploadUrl, fileUrl }: { uploadUrl: string; fileUrl: string } =
        await res.json();

      // Upload file to S3 with progress tracking
      await uploadFileToS3(file, uploadUrl, (progress) => {
        setUploadingFile((prev) => (prev ? { ...prev, progress } : null));
        if (onProgress) onProgress({ percent: progress });
      });

      message.success('Thumbnail uploaded successfully!');
      setUploadingFile(null);
      setUploadedFile({ name: file.name, url: fileUrl });
    } catch (error) {
      console.error('Upload failed:', error);
      message.error('Upload failed, please try again.');
      setUploadingFile(null);
    }
  };

  const uploadFileToS3 = async (
    file: File,
    uploadUrl: string,
    onProgress: (progress: number) => void
  ) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (response.ok) {
          resolve();
        } else {
          const errorText = await response.text();
          reject(new Error(`Upload failed: ${response.status} - ${errorText}`));
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const clearErrorsWithAnimation = () => {
    setIsRemovingErrors(true);
    setTimeout(() => {
      setImageValidation(null); // Remove validation errors AFTER fade-out
      setIsRemovingErrors(false);
    }, 200); // Matches animation duration (0.2s)
  };

  return (
    <AppLayout>
      <Title level={2}>Thumbnail Upload</Title>
      <Divider />
      <Paragraph style={{ marginBottom: 20 }}>
        Upload a thumbnail file to the <strong>{bucketName}</strong> S3 bucket.
        <br />
        For guidance on thumbnail requirements and resizing images, refer to the{' '}
        <Link
          href="https://github.com/NASA-IMPACT/veda-ui/blob/main/docs/content/frontmatter/media.md#media"
          target="_blank"
        >
          veda-ui documentation
        </Link>
        .
      </Paragraph>
      <div style={{ maxWidth: 700, margin: '50px auto', textAlign: 'center' }}>
        {!uploadedFile && !imageValidation && (
          <Upload.Dragger
            customRequest={handleUpload}
            maxCount={1}
            showUploadList={false}
            beforeUpload={() => {
              setUploadedFile(null);
              setUploadingFile(null);
              return true;
            }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag a thumbnail to upload
            </p>
            <p className="ant-upload-hint">Only one file at a time</p>
          </Upload.Dragger>
        )}

        <AnimatePresence>
          {imageValidation && !isRemovingErrors && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ marginTop: 20 }}
            >
              <Title level={4}>Image Validation</Title>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  marginBottom: 20,
                }}
              >
                <Statistic
                  title="Width"
                  value={imageValidation.width}
                  suffix="px"
                />
                <Statistic
                  title="Height"
                  value={imageValidation.height}
                  suffix="px"
                />
                <Statistic
                  title="Aspect Ratio"
                  value={imageValidation.aspectRatio.toFixed(2)}
                />
                <Statistic
                  title="Size"
                  value={imageValidation.fileSizeKB}
                  suffix="KB"
                />
              </div>

              {imageValidation.errors.length > 0 && (
                <>
                  <List
                    header={<strong>Errors</strong>}
                    bordered
                    dataSource={imageValidation.errors}
                    renderItem={(item) => (
                      <List.Item style={{ color: 'red' }}>{item}</List.Item>
                    )}
                  />
                  <Button
                    type="default"
                    onClick={clearErrorsWithAnimation}
                    style={{ marginTop: 10 }}
                  >
                    Choose a Different File
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {uploadingFile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ marginTop: 20 }}
          >
            <h3>Uploading...</h3>
            <Progress
              percent={uploadingFile.progress}
              status={uploadingFile.progress < 100 ? 'active' : 'success'}
            />
          </motion.div>
        )}

        {uploadedFile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ marginTop: 30 }}
          >
            <h3>Thumbnail Uploaded</h3>
            <Image
              src={uploadedFile.url}
              alt="Uploaded thumbnail"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 10,
                marginBottom: 10,
              }}
            />
            <List bordered>
              <List.Item>
                <strong>S3 URI:</strong>{' '}
                {`s3://${new URL(uploadedFile.url).host.split('.')[0]}/${new URL(uploadedFile.url).pathname.substring(1)}`}
              </List.Item>
            </List>
            <Button
              type="primary"
              onClick={() => setUploadedFile(null)}
              style={{ marginTop: 10 }}
            >
              Upload Another Thumbnail
            </Button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}

export default withConditionalAuthenticator(UploadPage, {
  hideSignUp: true,
  components: {
    SignIn: {
      Header: SignInHeader,
    },
  },
});
