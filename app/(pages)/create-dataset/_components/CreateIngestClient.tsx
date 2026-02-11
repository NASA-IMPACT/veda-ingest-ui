'use client';
import { useState } from 'react';
import AppLayout from '@/components/layout/Layout';
import { Spin } from 'antd';
import CreationFormManager from '@/components/ingestion/CreationFormManager';
import ErrorModal from '@/components/ui/ErrorModal';
import SuccessModal from '@/components/ui/SuccessModal';
import { Status } from '@/types/global';
import {
  TenantErrorBoundary,
  APIErrorBoundary,
} from '@/components/error-boundaries';

const CreateIngestClient = function CreateIngestClient() {
  const [status, setStatus] = useState<Status>('idle');
  const [collectionName, setCollectionName] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [pullRequestUrl, setPullRequestUrl] = useState('');

  const handleSuccessModalClose = () => {
    setStatus('idle');
    setCollectionName('');
    setPullRequestUrl('');
  };

  return (
    <AppLayout>
      <TenantErrorBoundary>
        <APIErrorBoundary
          onRetry={() => {
            // Reset form state on retry
            setStatus('idle');
            setApiErrorMessage('');
          }}
        >
          <CreationFormManager
            formType="dataset"
            setStatus={setStatus}
            setCollectionName={setCollectionName}
            setApiErrorMessage={setApiErrorMessage}
            setPullRequestUrl={setPullRequestUrl}
          />
        </APIErrorBoundary>
      </TenantErrorBoundary>

      {status === 'loadingGithub' && <Spin fullscreen />}
      {status === 'error' && (
        <ErrorModal
          collectionName={collectionName}
          apiErrorMessage={apiErrorMessage}
        />
      )}
      {status === 'success' && (
        <SuccessModal
          type="create"
          collectionName={collectionName}
          pullRequestUrl={pullRequestUrl}
          open={status === 'success'}
          onOk={handleSuccessModalClose}
          onCancel={handleSuccessModalClose}
        />
      )}
    </AppLayout>
  );
};

export default CreateIngestClient;
