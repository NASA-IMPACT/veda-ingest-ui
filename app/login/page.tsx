'use client';

import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { keycloakSignIn } from '@/app/actions/auth';
import { useSession } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  const handleSignIn = () => {
    startTransition(async () => {
      await keycloakSignIn('/');
    });
  };

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
      <Button
        type="primary"
        size="large"
        onClick={handleSignIn}
        loading={isPending}
        disabled={isPending}
      >
        Sign in with Keycloak
      </Button>
    </div>
  );
}
