import { useState } from 'react';

import { Spin, Layout } from 'antd';

import StyledHeader from '@/components/Header';
import ValidationForm from '@/components/ValidationForm';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import { Status } from '@/vite-env';

const { Content } = Layout;

const Dashboard = () => {

  const [status, setStatus] = useState<Status>('idle');
  const [collectionName, setCollectionName] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [pullRequestUrl, setPullRequestUrl] = useState('');

  return (
    <>
      <Layout>
        <StyledHeader/>
        <Content>
          <ValidationForm
            setStatus={setStatus}
            setCollectionName={setCollectionName}
            setApiErrorMessage={setApiErrorMessage}
            setPullRequestUrl={setPullRequestUrl}
          />
          {status === 'loading' && <Spin fullscreen />}
          {status === 'error' && (
            <ErrorModal
              collectionName={collectionName}
              apiErrorMessage={apiErrorMessage}
            />
          )}
          {status === 'success' && (
            <SuccessModal
              setStatus={setStatus}
              collectionName={collectionName}
              pullRequestUrl={pullRequestUrl}
            />
          )}
        </Content>
      </Layout>
    </>
  );
};

export default Dashboard;
