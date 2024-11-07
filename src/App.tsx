import { useState } from 'react';
import { Spin, Layout, ConfigProvider } from 'antd';
import './App.css'


import ValidationForm from './ValidationForm'
import ErrorModal from './ErrorModal';
import SuccessModal from './SuccessModal';

export type Status = 'idle'| 'loading' | 'success' | 'error';

const { Header, Content } = Layout;

const layoutStyle = {
  overflow: 'hidden',
  width: '90%',
  maxWidth: '90%',
  margin: '0 auto',
  backgroundColor: '#C3C1B7',

};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '4em',
  lineHeight: '1.1',
  backgroundColor: '#C3C1B7',
};


function App() {
  
  const [status, setStatus] = useState<Status>('idle');
  const [collectionName, setCollectionName] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [pullRequestUrl, setPullRequestUrl] = useState('');

  return (
    <ConfigProvider
    theme={{
      token: {
        // Seed Token
        colorPrimary: '#016996',
      },
    
    }}
    >
      <Layout style={layoutStyle} >
        <Header 
          style={headerStyle}
        >VEDA Data Ingest</Header>
        <Content>
          <ValidationForm
              setStatus={setStatus}
              setCollectionName={setCollectionName}
              setApiErrorMessage={setApiErrorMessage}
              setPullRequestUrl={setPullRequestUrl}
            />
          {status === 'loading' && <Spin fullscreen/>}
          {status === 'error' && 
            <ErrorModal
              collectionName={collectionName}
              apiErrorMessage={apiErrorMessage}
              />}
          {status === 'success' && 
            <SuccessModal
            setStatus={setStatus}
            collectionName={collectionName}
            pullRequestUrl={pullRequestUrl}
            />
          }
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

export default App
