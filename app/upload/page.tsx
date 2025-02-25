import { Upload, message, Progress, List, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { UploadProps } from 'antd/es/upload/interface';

interface UploadingFile {
  file: File;
  progress: number;
}

interface UploadedFile {
  name: string;
  url: string;
}

export default function UploadPage() {
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(
    null
  );
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const handleUpload: UploadProps['customRequest'] = async ({
    file,
    onProgress,
  }) => {
    if (!(file instanceof File)) {
      message.error('Invalid file type');
      return;
    }

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

      message.success(`${file.name} uploaded successfully!`);
      setUploadingFile(null);
      setUploadedFile({ name: file.name, url: fileUrl });
    } catch (error) {
      console.error('Upload failed:', error);
      message.error(`Upload failed for ${file.name}`);
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
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () =>
        xhr.status === 200 ? resolve() : reject(new Error('Upload failed'));
      xhr.onerror = reject;
      xhr.send(file);
    });
  };

  return (
    <div style={{ maxWidth: 600, margin: '50px auto' }}>
      <Upload.Dragger
        customRequest={handleUpload}
        maxCount={1} // Allow only one file
        showUploadList={false}
        beforeUpload={(file) => {
          const allowedTypes = ['image/png', 'image/jpeg'];
          if (!allowedTypes.includes(file.type)) {
            message.error('Only PNG, JPEG, and PDF files are allowed!');
            return Upload.LIST_IGNORE; // Prevent upload
          }
          setUploadedFile(null);
          setUploadingFile(null);
          return true;
        }}
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">Click or drag a file here to upload</p>
        <p className="ant-upload-hint">Only one file at a time</p>
      </Upload.Dragger>

      {/* Progress Bar */}
      {uploadingFile && (
        <div style={{ marginTop: 20 }}>
          <h3>Uploading...</h3>
          <span>{uploadingFile.file.name}</span>
          <Progress
            percent={uploadingFile.progress}
            status={uploadingFile.progress < 100 ? 'active' : 'success'}
          />
        </div>
      )}

      {/* Uploaded File Info */}
      {uploadedFile && (
        <div style={{ marginTop: 30 }}>
          <h3>Uploaded File</h3>
          <List bordered>
            <List.Item>
              <a
                href={uploadedFile.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {uploadedFile.name}
              </a>
            </List.Item>
          </List>
          <Button
            type="primary"
            danger
            onClick={() => setUploadedFile(null)}
            style={{ marginTop: 10 }}
          >
            Remove File
          </Button>
        </div>
      )}
    </div>
  );
}
