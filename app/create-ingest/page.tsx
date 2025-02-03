'use client';
import { useState } from 'react';
import AppLayout from '@/components/Layout';
import { Amplify } from 'aws-amplify';
import { config } from '@/utils/aws-exports';
import { SignInHeader } from '@/components/SignInHeader';

Amplify.configure({ ...config }, { ssr: true });

import { Spin } from 'antd';

import IngestCreationForm from '@/components/IngestCreationForm';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import { Status } from '@/types/global';
import { withConditionalAuthenticator } from '@/utils/withConditionalAuthenticator';

const CreateIngest = function CreateIngest() {
  const [status, setStatus] = useState<Status>('idle');
  const [collectionName, setCollectionName] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [pullRequestUrl, setPullRequestUrl] = useState('');

  return (
    <AppLayout>
      <IngestCreationForm
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
          setStatus={setStatus}
          collectionName={collectionName}
          pullRequestUrl={pullRequestUrl}
        />
      )}
    </AppLayout>
  );
};

export default withConditionalAuthenticator(CreateIngest, {
  hideSignUp: true,
  components: {
    SignIn: {
      Header: SignInHeader,
    },
  },
});
