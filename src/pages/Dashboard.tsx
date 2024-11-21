import { useState } from 'react';

import { Spin, Layout } from 'antd';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userpool from '../UserPool';

import ValidationForm from '@/components/ValidationForm';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';
import StyledHeader from '@/components/Header';
import { Status } from '@/typings/vite-env';

const { Content } = Layout;

const Dashboard = () => {
  const Navigate = useNavigate();

  const [status, setStatus] = useState<Status>('idle');
  const [collectionName, setCollectionName] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [pullRequestUrl, setPullRequestUrl] = useState('');

  useEffect(() => {
    const user = userpool.getCurrentUser();
    console.log(user);
    if (!user) {
      Navigate('/login');
    }
  }, [Navigate]);

  return (
    <>
      <Layout>
        <StyledHeader loggedIn={true} />
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
