'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/Layout';
import EditFormManager from '@/components/ingestion/EditFormManager';
import { Button, List, Spin } from 'antd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { Status } from '@/types/global';
import { Endpoints } from '@octokit/types';
import ErrorModal from '@/components/ui/ErrorModal';
import SuccessModal from '@/components/ui/SuccessModal';

type PullRequest =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][number];

const EditIngestClient = function EditIngestClient() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
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
    const url = 'api/list-ingests?ingestionType=dataset';
    try {
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        throw new Error(
          `There was an error on fetchPR: ${await response.text()}`
        );
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
    if (sessionStatus === 'authenticated') {
      fetchPRs();
    } else if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  if (sessionStatus === 'loading') {
    return <Spin fullscreen />;
  }

  const handleClick = async (ref: string, title: string) => {
    setStatus('loadingIngest');
    setCollectionName(title);
    const url = `/api/retrieve-ingest?ref=${ref}&ingestionType=dataset`;
    try {
      const response = await fetch(url, { method: 'GET' });
      setRef(ref);

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.error || 'Unknown error occurred.');
      }

      const { fileSha, filePath, content } = await response.json();

      if (
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
    fetchPRs();
  };

  const handleSuccess = () => {
    // Reset the form state to return to the initial list view
    setFormData({});
    setRef('');
    setFileSha('');
    setFilePath('');
    setCollectionName('');

    // Refetch the PR list. This function will handle its own loading and idle states.
    fetchPRs();
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
        <EditFormManager
          formType="dataset"
          gitRef={ref}
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
          open={status === 'success'}
          onOk={handleSuccess}
          onCancel={handleSuccess}
        />
      )}
    </AppLayout>
  );
};

export default EditIngestClient;
