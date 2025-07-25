'use client';
import { useState } from 'react';
import AppLayout from '@/components/Layout';
import { Spin } from 'antd';
import CreationFormManager from '@/components/CreationFormManager';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import { Status } from '@/types/global';

const CreateCollectionClient = function CreateIngestClient() {
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
      <CreationFormManager
        formType="collection"
        setStatus={setStatus}
        setCollectionName={setCollectionName}
        setApiErrorMessage={setApiErrorMessage}
        setPullRequestUrl={setPullRequestUrl}
      />

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

export default CreateCollectionClient;
