'use client';

import { Button } from 'antd';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
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
      <h1 style={{ marginBottom: '24px' }}>Sign in to VEDA Ingest UI</h1>
      <Button type="primary" size="large" onClick={() => signIn('keycloak')}>
        Sign in with Keycloak
      </Button>
    </div>
  );
}
