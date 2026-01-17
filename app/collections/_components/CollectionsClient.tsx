'use client';
import AppLayout from '@/components/layout/Layout';
import { Card, Col, Row, Tooltip, theme } from 'antd';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Title from 'antd/lib/typography/Title';
import {
  FileAddOutlined,
  FormOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';

const CollectionsClient = function CollectionsClient() {
  const { useToken } = theme;
  const { token } = useToken();
  const { data: session } = useSession();
  const hasLimitedAccess = session?.scopes?.includes('dataset:limited-access');
  const hasEditIngestPermission = session?.scopes?.includes('dataset:update');
  const hasEditStacCollectionPermission = session?.scopes?.includes(
    'stac:collection:update'
  );
  const isEditExistingCollectionEnabled =
    process.env.NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT === 'true';

  if (hasLimitedAccess) {
    return (
      <AppLayout>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          Collections Management
        </Title>
        <Title level={3}>Ingestion Requests</Title>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Tooltip
              title="Contact the VEDA Data Services team for access"
              placement="topLeft"
              color={token.colorBgElevated}
              styles={{
                container: {
                  color: token.colorText,
                  backgroundColor: token.colorBgElevated,
                  border: `1px solid ${token.colorBorder}`,
                },
              }}
            >
              <Card
                title={
                  <>
                    <FileAddOutlined style={{ marginRight: 8 }} />
                    Create New Collection Ingest Request
                  </>
                }
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
                Initiate a new Collection Ingestion
              </Card>
            </Tooltip>
          </Col>
          <Col span={12}>
            <Tooltip
              title="Contact the VEDA Data Services team for access"
              placement="topLeft"
              color={token.colorBgElevated}
              styles={{
                container: {
                  color: token.colorText,
                  backgroundColor: token.colorBgElevated,
                  border: `1px solid ${token.colorBorder}`,
                },
              }}
            >
              <Card
                title={
                  <>
                    <FormOutlined style={{ marginRight: 8 }} />
                    Edit Collection Ingest Request
                  </>
                }
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
        {isEditExistingCollectionEnabled && (
          <>
            <Title level={3} style={{ marginTop: 40 }}>
              Existing STAC Collections
            </Title>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Tooltip
                  title="Contact the VEDA Data Services team for access"
                  placement="topLeft"
                  color={token.colorBgElevated}
                  styles={{
                    container: {
                      color: token.colorText,
                      backgroundColor: token.colorBgElevated,
                      border: `1px solid ${token.colorBorder}`,
                    },
                  }}
                >
                  <Card
                    title={
                      <>
                        <DatabaseOutlined style={{ marginRight: 8 }} />
                        Edit Existing Collection
                      </>
                    }
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
              </Col>
            </Row>
          </>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        Collections Management
      </Title>
      <Title level={3}>Ingestion Requests</Title>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Link href="/create-collection">
            <Card
              title={
                <>
                  <FileAddOutlined style={{ marginRight: 8 }} />
                  Create New Collection Ingest Request
                </>
              }
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
                title={
                  <>
                    <FormOutlined style={{ marginRight: 8 }} />
                    Edit Collection Ingest Request
                  </>
                }
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
                container: {
                  color: token.colorText,
                  backgroundColor: token.colorBgElevated,
                  border: `1px solid ${token.colorBorder}`,
                },
              }}
            >
              <Card
                title={
                  <>
                    <FormOutlined style={{ marginRight: 8 }} />
                    Edit Collection Ingest Request
                  </>
                }
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
      {isEditExistingCollectionEnabled && (
        <>
          <Title level={3} style={{ marginTop: 40 }}>
            Existing STAC Collections
          </Title>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              {hasEditStacCollectionPermission ? (
                <Link href="/edit-existing-collection">
                  <Card
                    title={
                      <>
                        <DatabaseOutlined style={{ marginRight: 8 }} />
                        Edit Existing Collection
                      </>
                    }
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
                    container: {
                      color: token.colorText,
                      backgroundColor: token.colorBgElevated,
                      border: `1px solid ${token.colorBorder}`,
                    },
                  }}
                >
                  <Card
                    title={
                      <>
                        <DatabaseOutlined style={{ marginRight: 8 }} />
                        Edit Existing Collection
                      </>
                    }
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
        </>
      )}
    </AppLayout>
  );
};

export default CollectionsClient;
