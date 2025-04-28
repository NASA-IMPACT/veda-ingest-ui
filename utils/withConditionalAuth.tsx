'use client';

import { Spin } from 'antd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const isAuthDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export function withConditionalAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  const ConditionalAuth: React.FC<P> = (props) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (!isAuthDisabled && status === 'unauthenticated') {
        router.push('/sign-in');
      }
    }, [status, router]);

    if (isAuthDisabled || status === 'authenticated') {
      return <WrappedComponent {...props} />;
    }

    return <Spin fullscreen />;
  };

  return ConditionalAuth;
}
