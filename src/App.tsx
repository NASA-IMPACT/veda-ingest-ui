import { useState } from 'react';
import { Spin } from 'antd';
import './App.css'


import ValidationForm from './ValidationForm'
import ErrorModal from './ErrorModal';
import SuccessModal from './successModal';

export type Status = 'idle'| 'loading' | 'success' | 'error';

function App() {

  // 
  const [status, setStatus] = useState<Status>('idle');
  const [collectionName, setCollectionName] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [pullRequestUrl, setPullRequestUrl] = useState('');

  return (
    <div>
      <h1>VEDA Data Ingest</h1>
      <div>
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
      </div>
    </div>
  )
}

export default App
