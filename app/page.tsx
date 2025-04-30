'use client';

import '@ant-design/v5-patch-for-react-19';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Space, Spin } from 'antd';

import AppLayout from '@/components/Layout';

const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

const Home = function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!DISABLE_AUTH && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);

  if (!DISABLE_AUTH && (status === 'loading' || status === 'unauthenticated')) {
    return (
      <AppLayout>
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: 100 }}
        >
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

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

export default Home;
