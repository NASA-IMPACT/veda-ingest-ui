
"use client"
import { useState } from 'react';
import AppLayout from '../../components/Layout';

import {  Spin } from 'antd';

import ValidationForm from '../../components/ValidationForm';
import ErrorModal from '../../components/ErrorModal';
import SuccessModal from '../../components/SuccessModal';

const CreateIngest = function CreateIngest() {
  const [status, setStatus] = useState('idle');
  const [collectionName, setCollectionName] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [pullRequestUrl, setPullRequestUrl] = useState('');

  return (
    <AppLayout>
          <ValidationForm setStatus={setStatus} setCollectionName={setCollectionName} setApiErrorMessage={setApiErrorMessage} setPullRequestUrl={setPullRequestUrl} />
          {status === 'loading' && <Spin fullscreen />}
          {status === 'error' && <ErrorModal collectionName={collectionName} apiErrorMessage={apiErrorMessage} />}
          {status === 'success' && <SuccessModal setStatus={setStatus} collectionName={collectionName} pullRequestUrl={pullRequestUrl} />}
    </AppLayout>
  );
};

export default CreateIngest