'use client';
import AppLayout from '@/components/layout/Layout';
import { Layout, List, Typography, Row, Col, Card, Tooltip, theme } from 'antd';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const DatasetsClient = function DatasetsClient() {
  const { useToken } = theme;
  const { token } = useToken();
  const { data: session } = useSession();
  const hasEditIngestPermission = session?.scopes?.includes('dataset:update');

  return (
    <AppLayout>
      <h2>Ingestion Requests</h2>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Link href="/create-dataset">
            <Card
              title="Create New Dataset Ingest Request"
              variant="outlined"
              hoverable={true}
            >
              Initiate a new dataset Ingestion
            </Card>
          </Link>
        </Col>
        <Col span={12}>
          {hasEditIngestPermission ? (
            <Link href="/edit-dataset">
              <Card
                title="Edit Dataset Ingest Request"
                variant="outlined"
                hoverable={true}
              >
                View and Edit existing dataset Ingest Requests
              </Card>
            </Link>
          ) : (
            <Tooltip
              title="Contact the Data Services Team if you need access to editing Ingest Requests"
              placement="topLeft"
              color={token.colorBgElevated}
              styles={{
                body: {
                  color: token.colorText,
                  backgroundColor: token.colorBgElevated,
                  border: `1px solid ${token.colorBorder}`,
                },
              }}
            >
              <Card
                title="Edit Dataset Ingest Request"
                variant="outlined"
                style={{
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  pointerEvents: 'auto',
                  backgroundColor: token.colorBgContainerDisabled,
                  borderColor: token.colorBorder,
                  color: token.colorTextDisabled,
                }}
              >
                View and Edit existing dataset Ingest Requests
              </Card>
            </Tooltip>
          )}
        </Col>
      </Row>
    </AppLayout>
  );
};

export default DatasetsClient;
