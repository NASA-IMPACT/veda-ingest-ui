import { Card, Row, Col, Skeleton, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface SkeletonLoadingProps {
  allowedTenants?: string[];
}

export const SkeletonLoading: React.FC<SkeletonLoadingProps> = ({
  allowedTenants,
}) => {
  const hasAllowedTenants = allowedTenants && allowedTenants.length > 0;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 24,
          padding: '12px 16px',
          backgroundColor: '#e6f7ff',
          border: '1px solid #91d5ff',
          borderRadius: 4,
        }}
      >
        <LoadingOutlined style={{ fontSize: 16, color: '#0969da' }} />
        <span style={{ color: '#0969da' }}>
          Checking with GitHub for pending ingests...
        </span>
      </div>

      <Row gutter={[16, 16]}>
        {hasAllowedTenants &&
          allowedTenants!.map((_, index) => (
            <Col key={`skeleton-${index}`} xs={24} sm={12} md={8} lg={6}>
              <Card
                title={<Skeleton.Input size="small" style={{ width: 120 }} />}
                style={{
                  marginBottom: 24,
                  borderRadius: 8,
                  boxShadow: '0 2px 8px #f0f1f2',
                }}
              >
                <Space
                  direction="vertical"
                  style={{ width: '100%' }}
                  size="large"
                >
                  {[1, 2, 3].map((skeletonIndex) => (
                    <Skeleton
                      key={`skeleton-item-${skeletonIndex}`}
                      // active
                      paragraph={{ rows: 1 }}
                    />
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            title={<Skeleton.Input size="small" style={{ width: 120 }} />}
            style={{
              marginBottom: 24,
              borderRadius: 8,
              boxShadow: '0 2px 8px #f0f1f2',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {[1, 2, 3].map((skeletonIndex) => (
                <Skeleton
                  key={`skeleton-item-${skeletonIndex}`}
                  // active
                  paragraph={{ rows: 1 }}
                />
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  );
};
