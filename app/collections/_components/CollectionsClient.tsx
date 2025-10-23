'use client';
import AppLayout from '@/components/layout/Layout';
import { Card, Col, Row, Tooltip, theme } from 'antd';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const CollectionsClient = function CollectionsClient() {
  const { useToken } = theme;
  const { token } = useToken();
  const { data: session } = useSession();
  const hasEditIngestPermission = session?.scopes?.includes('dataset:update');
  const hasEditStacCollectionPermission = session?.scopes?.includes(
    'stac:collection:update'
  );

  return (
    <AppLayout>
      <h2>Ingestion Requests</h2>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Link href="/create-collection">
            <Card
              title="Create New Collection Ingest Request"
              variant="outlined"
              hoverable={true}
            >
              Initiate a new Collection Ingestion
            </Card>
          </Link>
        </Col>
        <Col span={12}>
          {hasEditIngestPermission ? (
            <Link href="/edit-collection">
              <Card
                title="Edit Collection Ingest Request"
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
                title="Edit Collection Ingest Request"
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
      <h2 style={{ marginTop: 32 }}>Existing STAC Collections</h2>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          {hasEditStacCollectionPermission ? (
            <Link href="/edit-existing-collection">
              <Card
                title="Edit Existing Collection"
                variant="outlined"
                hoverable={true}
              >
                Edit collections that have already been ingested
              </Card>
            </Link>
          ) : (
            <Tooltip
              title="Contact the Data Services Team if you need access to editing Existing Collections"
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
                title="Edit Existing Collection"
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
                Edit collections that have already been ingested
              </Card>
            </Tooltip>
          )}
        </Col>
      </Row>
    </AppLayout>
  );
};

export default CollectionsClient;
