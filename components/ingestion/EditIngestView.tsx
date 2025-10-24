'use client';

import { useEffect, useState } from 'react';
import EditFormManager from '@/components/ingestion/EditFormManager';
import { Spin, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Status } from '@/types/global';
import ErrorModal from '@/components/ui/ErrorModal';
import SuccessModal from '@/components/ui/SuccessModal';

interface EditIngestViewProps {
  ingestionType: 'dataset' | 'collection';
  gitRef: string;
  initialTitle: string;
  onComplete: () => void;
}

const EditIngestView: React.FC<EditIngestViewProps> = ({
  ingestionType,
  gitRef,
  initialTitle,
  onComplete,
}) => {
  const [status, setStatus] = useState<Status>('loadingIngest');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [fileSha, setFileSha] = useState('');
  const [filePath, setFilePath] = useState('');

  useEffect(() => {
    const fetchIngestDetails = async () => {
      setStatus('loadingIngest');
      try {
        const url = `/api/retrieve-ingest?ref=${gitRef}&ingestionType=${ingestionType}`;
        const response = await fetch(url);
        if (!response.ok) {
          const errorResponse = await response.json();
          throw new Error(errorResponse.error || 'Unknown error occurred.');
        }

        const { fileSha, filePath, content } = await response.json();
        setFilePath(filePath);
        setFileSha(fileSha);
        setFormData(content);
        setStatus('idle');
      } catch (err) {
        setApiErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
        setStatus('error');
      }
    };
    fetchIngestDetails();
  }, [gitRef, ingestionType]);

  if (status === 'loadingIngest') {
    return <Spin fullscreen />;
  }

  return (
    <>
      <Button
        type="default"
        icon={<ArrowLeftOutlined />}
        onClick={onComplete}
        style={{ marginBottom: 16 }}
        aria-label="Back to collection list"
      >
        Back
      </Button>
      <EditFormManager
        formType={ingestionType}
        gitRef={gitRef}
        filePath={filePath}
        fileSha={fileSha}
        formData={formData}
        setFormData={setFormData}
        setStatus={setStatus}
        handleCancel={onComplete}
        setApiErrorMessage={setApiErrorMessage}
      />
      {status === 'loadingGithub' && <Spin fullscreen />}
      {status === 'error' && (
        <ErrorModal
          collectionName={initialTitle}
          apiErrorMessage={apiErrorMessage}
        />
      )}
      {status === 'success' && (
        <SuccessModal
          type="edit"
          collectionName={initialTitle}
          open={status === 'success'}
          onOk={onComplete}
          onCancel={onComplete}
        />
      )}
    </>
  );
};

export default EditIngestView;
