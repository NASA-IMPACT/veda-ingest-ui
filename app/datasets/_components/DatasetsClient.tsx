'use client';
import AppLayout from '@/components/layout/Layout';
import { Layout, List, Typography, Row, Col, Card } from 'antd';
import Link from 'next/link';

const IngestClient = function IngestClient() {
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

export default IngestClient;
