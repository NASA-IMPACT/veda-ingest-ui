'use client';

import AppLayout from '@/components/layout/Layout';
import { Layout, List, Typography, Row, Col, Card, Tooltip, theme } from 'antd';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const DatasetsClient = function DatasetsClient() {
  const { useToken } = theme;
  const { token } = useToken();
  const { data: session } = useSession();
  const hasLimitedAccess = session?.scopes?.includes('dataset:limited-access');

  if (hasLimitedAccess) {
    return (
      <AppLayout>
        <Row gutter={16}>
          <Col span={12}>
            <Tooltip
              title="Contact the VEDA Data Services team for access"
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
                title="Create New Dataset Ingest Request"
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
                Initiate a new dataset Ingestion
              </Card>
            </Tooltip>
          </Col>
          <Col span={12}>
            <Tooltip
              title="Contact the VEDA Data Services team for access"
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
          </Col>
        </Row>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Row gutter={16}>
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
          <Link href="/edit-dataset">
            <Card
              title="Edit Dataset Ingest Request"
              variant="outlined"
              hoverable={true}
            >
              View and Edit existing dataset Ingest Requests
            </Card>
          </Link>
        </Col>
      </Row>
    </AppLayout>
  );
};

export default DatasetsClient;
