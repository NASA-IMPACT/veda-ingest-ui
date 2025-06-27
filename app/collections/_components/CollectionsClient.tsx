'use client';
import AppLayout from '@/components/Layout';
import { Card, Col, Row, Spin } from 'antd';
import Link from 'next/link';

const IngestClient = function IngestClient() {
  return (
    <AppLayout>
      <Row gutter={16}>
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
          <Link href="/edit-collection">
            <Card
              title="Edit Collection Ingest Request"
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

export default IngestClient;
