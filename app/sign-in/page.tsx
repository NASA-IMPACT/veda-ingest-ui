'use client';

import { Button, Typography } from 'antd';
import { signIn } from 'next-auth/react';

const SignInPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Typography.Title level={1} style={{ color: 'white', marginBottom: 8 }}>
        VEDA Ingest UI
      </Typography.Title>
      <Typography.Text
        style={{
          color: 'white',
          marginBottom: 24,
          display: 'block',
          textAlign: 'center',
          fontSize: '1.1rem',
        }}
      >
        Sign in to manage the data ingest process.
      </Typography.Text>
      <Button type="primary" size="large" onClick={() => signIn('keycloak')}>
        Sign In with Keycloak
      </Button>
    </div>
  );
};

export default SignInPage;
