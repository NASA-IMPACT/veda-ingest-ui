'use client';

import { useEffect, useState } from 'react';
import { Row, Typography } from 'antd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ErrorModal from '@/components/ui/ErrorModal';

import { IngestPullRequest } from '@/types/ingest';
import { useUserTenants } from '@/app/contexts/TenantContext';
import { getTenantFieldKey } from '@/utils/tenantField';
import { IngestColumn } from './_components/IngestColumn';
import { SkeletonLoading } from './_components/SkeletonLoading';

const { Title } = Typography;

interface PendingIngestListProps {
  ingestionType: 'dataset' | 'collection';
  onIngestSelect: (ref: string, title: string) => void;
}

const getIngestTenant = (ingest: IngestPullRequest): string | undefined => {
  const tenantFieldKey = getTenantFieldKey();
  const ingestRecord = ingest as unknown as Record<string, unknown>;
  const tenant = ingestRecord[tenantFieldKey];
  return typeof tenant === 'string' ? tenant : undefined;
};

const PendingIngestList: React.FC<PendingIngestListProps> = ({
  ingestionType,
  onIngestSelect,
}) => {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [allIngests, setAllIngests] = useState<IngestPullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const { tenants } = useUserTenants();
  const visibleTenants = tenants.filter(
    (tenant) => tenant.toLowerCase() !== 'public'
  );

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
          setAllIngests(githubResponse);
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
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <>
        <Title level={3} style={{ marginBottom: 24 }}>
          Edit Pending Ingest Requests
        </Title>
        <SkeletonLoading
          count={Math.max(visibleTenants.length + 1, 3)}
          bannerMessage="Checking with GitHub for pending ingests..."
        />
      </>
    );
  }

  const publicIngests = allIngests.filter(
    (ingest) =>
      !getIngestTenant(ingest) ||
      getIngestTenant(ingest) === '' ||
      getIngestTenant(ingest)?.toLowerCase() === 'public'
  );

  return (
    <>
      <Title level={3} style={{ marginBottom: 24 }}>
        Edit Pending Ingest Requests
      </Title>

      <Row gutter={[16, 16]}>
        {visibleTenants.length > 0 &&
          visibleTenants.map((tenant: string) => {
            const tenantIngests: IngestPullRequest[] = allIngests.filter(
              (ingest: IngestPullRequest) => getIngestTenant(ingest) === tenant
            );

            return (
              <IngestColumn
                key={tenant}
                title={`Tenant: ${tenant}`}
                ingests={tenantIngests}
                onIngestSelect={onIngestSelect}
                testId={`tenant-column-${tenant}`}
              />
            );
          })}

        {publicIngests.length > 0 && (
          <IngestColumn
            key="public"
            title="Public"
            ingests={publicIngests}
            onIngestSelect={onIngestSelect}
            testId="tenant-column-public"
          />
        )}
      </Row>

      {apiError && (
        <ErrorModal context="ingests-fetch" apiErrorMessage={apiError} />
      )}
    </>
  );
};

export { PendingIngestList };
