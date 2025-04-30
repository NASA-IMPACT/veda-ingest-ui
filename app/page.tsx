'use client';
import '@ant-design/v5-patch-for-react-19';

import { Space, Button } from 'antd';
import AppLayout from '@/components/Layout';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const Home = function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    // Redirect to the login page if not authenticated
    router.push('/login');
    return null; // Or a loading state
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
        <Space direction="vertical" align="center">
          <div>
            This application allows users to initiate the data ingest process.
          </div>
          <Button onClick={() => signOut({ callbackUrl: '/' })}>
            Sign Out
          </Button>
        </Space>
      </section>
    </AppLayout>
  );
};

export default Home;
