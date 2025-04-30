'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout';
import IngestEditForm from '@/components/IngestEditForm';
import { SignInHeader } from '@/components/SignInHeader';
import { Button, List, Spin } from 'antd';

import { Status } from '@/types/global';
import { Endpoints } from '@octokit/types';
import ErrorModal from '@/components/ErrorModal';
import SuccessModal from '@/components/SuccessModal';

// Type definitions
type PullRequest =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][number];

const EditIngest = function EditIngest() {
  const [data, setData] = useState<PullRequest[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [ref, setRef] = useState('');
  const [fileSha, setFileSha] = useState('');
  const [filePath, setFilePath] = useState('');
  const [collectionName, setCollectionName] = useState('');

  const fetchPRs = async () => {
    setStatus('loadingPRs');
    const url = 'api/list-ingests';
    const requestOptions = {
      method: 'GET',
    };
    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`There was an error on fetchPR: ${errorMessage}`);
      }

      const { githubResponse }: { githubResponse: PullRequest[] } =
        await response.json();
      setData(githubResponse);
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchPRs();
  }, []);

  const handleClick = async (ref: string, title: string) => {
    setStatus('loadingIngest');
    setCollectionName(title);
    const url = `api/retrieve-ingest?ref=${ref}`;
    const requestOptions = {
      method: 'GET',
    };
    try {
      const response = await fetch(url, requestOptions);
      setRef(ref);

      if (!response.ok) {
        const errorResponse = await response.json();
        const errorMessage = errorResponse.error || 'Unknown error occurred.';
        throw new Error(errorMessage);
      }

      const { fileSha, filePath, content } = await response.json();

      // Ensure renders is stored as a pretty string if it's an object
      if (
        content.renders &&
        content.renders?.dashboard &&
        typeof content.renders.dashboard === 'object'
      ) {
        content.renders.dashboard = JSON.stringify(
          content.renders.dashboard,
          null,
          2
        );
      }

      setFilePath(filePath);
      setFileSha(fileSha);
      setFormData(content);
      setStatus('idle');
    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setApiErrorMessage(errorMessage);
      setStatus('error');
    }
  };

  const handleCancel = () => {
    setFilePath('');
    setFileSha('');
    setFormData({});
  };

  return (
    <AppLayout>
      {Object.keys(formData).length === 0 && (
        <List
          header={
            <div>
              <div>Pending Ingest Requests</div>
            </div>
          }
          bordered
          dataSource={data}
          loading={status === 'loadingPRs'}
          renderItem={(item: PullRequest) => (
            <List.Item key={item.id}>
              <Button onClick={() => handleClick(item.head.ref, item.title)}>
                {item.title}
              </Button>
            </List.Item>
          )}
        />
      )}
      {status === 'loadingIngest' && <Spin fullscreen />}
      {Object.keys(formData).length > 0 && (
        <IngestEditForm
          ref={ref}
          filePath={filePath}
          fileSha={fileSha}
          formData={formData}
          setFormData={setFormData}
          setStatus={setStatus}
          handleCancel={handleCancel}
          setApiErrorMessage={setApiErrorMessage}
        />
      )}
      {status === 'loadingGithub' && <Spin fullscreen />}
      {status === 'error' && (
        <ErrorModal
          collectionName={collectionName}
          apiErrorMessage={apiErrorMessage}
        />
      )}
      {status === 'success' && (
        <SuccessModal
          type="edit"
          collectionName={collectionName}
          setStatus={setStatus}
        />
      )}
    </AppLayout>
  );
};

export default EditIngest;
