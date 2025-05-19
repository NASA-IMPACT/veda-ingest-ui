'use client';

import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <Result
        status="404"
        title={<div style={{ color: '#FFFFFF' }}>404</div>}
        subTitle={
          <div style={{ color: '#FFFFFF' }}>
            Sorry, the page you visited does not exist.
          </div>
        }
        extra={[
          <Button key="back" type="primary" onClick={() => router.back()}>
            Go Back
          </Button>,
          <Button key="home" onClick={() => router.push('/')}>
            Go Home
          </Button>,
        ]}
      />
    </div>
  );
}
