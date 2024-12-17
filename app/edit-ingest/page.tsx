'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { config } from '@/utils/aws-exports';
import { SignInHeader } from '@/components/SignInHeader';
import { Button, List, Spin } from 'antd';

import { Status } from '@/types/global';
import { RJSFSchema } from '@rjsf/utils';
import { Endpoints } from '@octokit/types';
type PullRequests =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'];

import IngestEditForm from '@/components/IngestEditForm';


Amplify.configure({ ...config }, { ssr: true });

const EditIngest = function EditIngest() {
  const [data, setData] = useState<PullRequests[]>();
  const [status, setStatus] = useState<Status>('idle');
  const [formData, setFormData] = useState<RJSFSchema>({});
  const [ref, setRef] = useState('');
  const [fileSha, setFileSha] = useState('');
  const [filePath, setFilePath] = useState('');

  const fetchPRs = async function () {
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

      const { githubResponse } = await response.json();
      // Type the response data
      const pullRequests: Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][] =
        githubResponse;
      setData(pullRequests);
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchPRs();
  }, []);

  const handleClick = async (ref: string, sha: string) => {
    setStatus('loadingIngest');
    const url = `api/retrieve-ingest?ref=${ref}`;
    const requestOptions = {
      method: 'GET',
    };
    try {
      const response = await fetch(url, requestOptions);
      console.log(`trying to update branch with sha: ${sha} and ref: ${ref}`);
      setRef(ref);

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`There was an error on handleClick: ${errorMessage}`);
      }

      const { fileSha, filePath, content } = await response.json();

      setFilePath(filePath);
      setFileSha(fileSha);
      setFormData(content);
      setStatus('idle');
    } catch (err) {
      console.error(err);
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
      {
        Object.keys(formData).length === 0 && (
          <List
            header={
              <div>
                <div>Pending Ingest Requests</div>
              </div>
            }
            bordered
            dataSource={data}
            loading={status === 'loadingPRs'}
            renderItem={(item: PullRequests) => (
              <List.Item>
                <Button
                  onClick={() =>
                    handleClick(
                      /* @ts-ignore head does exist */
                      item.head.ref,
                      /* @ts-ignore head does exist*/
                      item.head.sha
                    )
                  }
                >
                  {/* @ts-expect-error: title does exist */}
                  {item.title}
                </Button>
              </List.Item>
            )}
          />
        )
      }
      {status === 'loadingIngest' && <Spin fullscreen />}
      {
        Object.keys(formData).length > 0 && (
            <IngestEditForm
                setStatus={setStatus}
                ref={ref}
                filePath={filePath}
                fileSha={fileSha}
                handleCancel={handleCancel}
              />
        )
      }
    </AppLayout>
  );
};

export default withAuthenticator(EditIngest, {
  hideSignUp: true,
  components: {
    SignIn: {
      Header: SignInHeader,
    },
  },
});
