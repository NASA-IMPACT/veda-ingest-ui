'use client';

import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

const UnauthorizedPage = () => {
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
        status="403"
        title={<div style={{ color: '#FFFFFF' }}>Unauthorized</div>}
        subTitle={
          <div style={{ color: '#FFFFFF' }}>
            Sorry, you do not have permission to edit existing requests. Please
            contact an administrator for assistance.
          </div>
        }
        extra={[
          <Button key="back" type="primary" onClick={() => router.back()}>
            Go Back
          </Button>,
        ]}
      />
    </div>
  );
};

export default UnauthorizedPage;
