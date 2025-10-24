'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  List,
  Spin,
  Card,
  Row,
  Col,
  Typography,
  Empty,
  Tooltip,
  Alert,
} from 'antd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ErrorModal from '@/components/ui/ErrorModal';

import { IngestPullRequest } from '@/types/ingest';

import { useUserTenants } from '@/app/contexts/TenantContext';

const { Title } = Typography;

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
  const [allIngests, setAllIngests] = useState<IngestPullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const { allowedTenants } = useUserTenants();

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
    return <Spin fullscreen />;
  }

  const publicIngests = allIngests.filter(
    (ingest) => !ingest.tenant || ingest.tenant === ''
  );

  return (
    <>
      <Title level={3} style={{ marginBottom: 24 }}>
        Edit Pending Ingest Requests
      </Title>

      {!apiError && allIngests.length === 0 && (
        <Empty description="No pending ingests found." />
      )}

      {allIngests.length > 0 && (
        <Row gutter={[16, 16]}>
          {allowedTenants?.map((tenant: string) => {
            const tenantIngests: IngestPullRequest[] = allIngests.filter(
              (ingest: IngestPullRequest) => ingest.tenant === tenant
            );

            return (
              <Col
                key={tenant}
                xs={24}
                sm={12}
                md={8}
                lg={6}
                data-testid={`tenant-column-${tenant}`}
              >
                <Card
                  title={`Tenant: ${tenant}`}
                  style={{
                    marginBottom: 24,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px #f0f1f2',
                  }}
                >
                  <List
                    dataSource={tenantIngests}
                    renderItem={(item: IngestPullRequest) => (
                      <List.Item>
                        <Tooltip title={item.pr.title} placement="topLeft">
                          <Button
                            onClick={() =>
                              onIngestSelect(item.pr.head.ref, item.pr.title)
                            }
                            block
                          >
                            <span
                              style={{
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.pr.title.replace('Ingest Request for ', '')}
                            </span>
                          </Button>
                        </Tooltip>
                      </List.Item>
                    )}
                    locale={{ emptyText: 'No pending ingests' }}
                  />
                </Card>
              </Col>
            );
          })}

          {publicIngests.length > 0 && (
            <Col
              key="public"
              xs={24}
              sm={12}
              md={8}
              lg={6}
              data-testid="tenant-column-public"
            >
              <Card
                title="Public"
                style={{
                  marginBottom: 24,
                  borderRadius: 8,
                  boxShadow: '0 2px 8px #f0f1f2',
                }}
              >
                <List
                  dataSource={publicIngests}
                  renderItem={(item: IngestPullRequest) => (
                    <List.Item>
                      <Tooltip title={item.pr.title} placement="topLeft">
                        <Button
                          onClick={() =>
                            onIngestSelect(item.pr.head.ref, item.pr.title)
                          }
                          block
                        >
                          <span
                            style={{
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.pr.title.replace('Ingest Request for ', '')}
                          </span>
                        </Button>
                      </Tooltip>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'No pending ingests' }}
                />
              </Card>
            </Col>
          )}
        </Row>
      )}

      {apiError && (
        <ErrorModal
          collectionName="Error Fetching Requests"
          apiErrorMessage={apiError}
        />
      )}
    </>
  );
};

export { PendingIngestList };
