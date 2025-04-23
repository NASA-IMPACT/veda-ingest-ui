'use client';
import '@ant-design/v5-patch-for-react-19';

import { Space } from 'antd';

import AppLayout from '@/components/Layout';
import { withConditionalAuth } from '@/utils/withConditionalAuth';

const Home = function Home() {
  return (
    <AppLayout>
      <section
        style={{
          textAlign: 'center',
          marginTop: 48,
          marginBottom: 40,
          padding: 100,
        }}
      >
        <Space align="start">
          This application allows users to initiate the data ingest process.
        </Space>
      </section>
    </AppLayout>
  );
};

export default withConditionalAuth(Home);
