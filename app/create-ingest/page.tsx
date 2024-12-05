// export default function Page() {
//   return <h1>Hello, Dashboard Page!</h1>
// }
"use client"
import { useState } from 'react';
import AppLayout from '../../components/Layout';

import {  Spin } from 'antd';
import withTheme from '../../theme';

import ValidationForm from '../../components/ValidationForm';
import ErrorModal from '../../components/ErrorModal';
import SuccessModal from '../../components/SuccessModal';

const Home = function Home() {
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

const HomePage = () => {
  return withTheme(<Home />);
}

export default HomePage;