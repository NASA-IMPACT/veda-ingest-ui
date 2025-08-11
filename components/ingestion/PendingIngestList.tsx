'use client';

import { useEffect, useState } from 'react';
import { Button, List, Spin } from 'antd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Endpoints } from '@octokit/types';
import ErrorModal from '@/components/ui/ErrorModal';

type PullRequest =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][number];

interface PendingIngestListProps {
  ingestionType: 'dataset' | 'collection';
  onIngestSelect: (ref: string, title: string) => void;
}

const PendingIngestList: React.FC<PendingIngestListProps> = ({
  ingestionType,
  onIngestSelect,
}) => {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
    if (sessionStatus === 'authenticated') {
      const fetchPRs = async () => {
        setIsLoading(true);
        setApiError('');
        try {
          const url = `api/list-ingests?ingestionType=${ingestionType}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(await response.text());
          }
          const { githubResponse } = await response.json();
          setPullRequests(githubResponse);
        } catch (err) {
          setApiError(
            err instanceof Error ? err.message : 'An unknown error occurred.'
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchPRs();
    }
  }, [sessionStatus, ingestionType, router]);

  //  Automatically clear the error after a delay
  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => {
        setApiError(''); // Clear error after 5 seconds
      }, 5000);

      // Clean up the timer if the component unmounts or the error changes
      return () => clearTimeout(timer);
    }
  }, [apiError]);

  if (sessionStatus === 'loading') {
    return <Spin fullscreen />;
  }

  return (
    <>
      <List
        header={<div>Pending Ingest Requests</div>}
        bordered
        dataSource={pullRequests}
        loading={isLoading}
        renderItem={(item: PullRequest) => (
          <List.Item key={item.id}>
            <Button onClick={() => onIngestSelect(item.head.ref, item.title)}>
              {item.title}
            </Button>
          </List.Item>
        )}
      />

      {apiError && (
        <ErrorModal
          collectionName="Error Fetching Requests"
          apiErrorMessage={apiError}
        />
      )}
    </>
  );
};

export default PendingIngestList;
