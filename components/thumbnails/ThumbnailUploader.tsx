'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  List,
  message,
  Upload,
  Image,
  Statistic,
  Typography,
  Divider,
  Modal,
} from 'antd';
import {
  CloudUploadOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Link } = Typography;
const { confirm } = Modal;

const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png'];
const CLOUDFRONT_URL = 'https://thumbnails.openveda.cloud/';

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

interface ThumbnailUploaderProps {
  insideDrawer?: boolean;
  onUploadSuccess?: (s3Uri: string) => void;
}

function ThumbnailUploader({
  insideDrawer = false,
  onUploadSuccess,
}: ThumbnailUploaderProps) {
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(
    null
  );
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [imageValidation, setImageValidation] =
    useState<ImageValidationResult | null>(null);
  const [isRemovingErrors, setIsRemovingErrors] = useState(false);
  const [copied, setCopied] = useState(false);

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
      message.error('No valid file selected. Please try again.');
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      message.error('Invalid file format. Please upload a JPG or PNG image.');
      return;
    }

    const isValid = await validateImage(file);
    if (!isValid) return;

    const loadingMessage = message.loading('Authenticating Upload', 0);
    setUploadingFile({ file, progress: 0 });

    try {
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, filetype: file.type }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || 'Failed to get presigned URL');
      }

      const {
        uploadUrl,
        fileUrl,
        fileExists,
      }: { uploadUrl: string; fileUrl: string; fileExists: boolean } =
        await res.json();

      loadingMessage();

      if (fileExists) {
        confirm({
          title: 'File Already Exists',
          icon: <ExclamationCircleOutlined />,
          content: `A file with the name "${file.name}" already exists. Do you want to overwrite it?`,
          okText: 'Overwrite',
          cancelText: 'Cancel',
          onOk() {
            proceedWithUpload(file, uploadUrl, fileUrl, onProgress);
          },
          onCancel: () => {
            setImageValidation(null);
            setUploadedFile(null);
          },
        });
        return;
      }

      await proceedWithUpload(file, uploadUrl, fileUrl, onProgress);
    } catch (error) {
      loadingMessage();
      console.error('Upload failed:', error);
      message.error('Upload failed, please try again.');
      setUploadingFile(null);
      clearErrorsWithAnimation();
    }
  };

  const proceedWithUpload = async (
    file: File,
    uploadUrl: string,
    fileUrl: string,
    onProgress: (progress: { percent: number }) => void
  ) => {
    const closeUploadingMessage = message.loading('Uploading file...', 0);

    try {
      await uploadFileToS3(file, uploadUrl, (progress) => {
        setUploadingFile((prev) => (prev ? { ...prev, progress } : null));
        if (onProgress) onProgress({ percent: progress });
      });

      closeUploadingMessage();
      message.success('Thumbnail uploaded successfully!');
      setUploadingFile(null);
      setUploadedFile({ name: file.name, url: fileUrl });
    } catch (error) {
      closeUploadingMessage();
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
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(
            new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`)
          );
        }
      };

      xhr.onerror = () =>
        reject(new Error('Network error during file upload.'));
      xhr.send(file);
    });
  };

  const clearErrorsWithAnimation = () => {
    setIsRemovingErrors(true);
    setTimeout(() => {
      setImageValidation(null);
      setIsRemovingErrors(false);
    }, 200);
  };

  const handleCopy = async () => {
    if (!uploadedFile) return;

    try {
      await navigator.clipboard.writeText(uploadedFile.url);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <>
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
        <AnimatePresence>
          {!uploadedFile && !imageValidation && (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Upload.Dragger
                customRequest={handleUpload}
                maxCount={1}
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon">
                  <CloudUploadOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag a thumbnail to upload
                </p>
              </Upload.Dragger>
            </motion.div>
          )}
        </AnimatePresence>

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

        <AnimatePresence>
          {uploadedFile && (
            <motion.div
              key="upload-success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h3>Thumbnail Uploaded</h3>
              <Image
                src={`${CLOUDFRONT_URL}${uploadedFile.name}`}
                alt="Uploaded thumbnail"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              />
              <List bordered>
                <List.Item style={{ display: 'flex' }}>
                  <div>
                    <strong>URL:</strong> {uploadedFile.url}
                  </div>
                  <Button icon={<CopyOutlined />} onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </List.Item>
              </List>
              <Button
                type="primary"
                onClick={() => {
                  if (insideDrawer) {
                    onUploadSuccess?.(uploadedFile.url);
                  }
                  setUploadedFile(null);
                  setImageValidation(null);
                }}
                style={{ marginTop: 10 }}
              >
                {insideDrawer ? 'Continue' : 'Upload Another Thumbnail'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default ThumbnailUploader;
