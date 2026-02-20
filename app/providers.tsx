'use client';

import React, { useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { ConfigProvider, App } from 'antd';
import { TenantProvider } from '@/app/contexts/TenantContext';
import { useRouter, usePathname } from 'next/navigation';
import theme from '@/theme/themeConfig';

function SessionCheckWrapper({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If user is unauthenticated and not on a public page, redirect to login
    if (status === 'unauthenticated' && !pathname?.startsWith('/login')) {
      router.push('/login');
    }
  }, [status, pathname, router]);

  // Show nothing while checking session to avoid flash of content
  if (status === 'loading') {
    return null;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={theme}>
      <App>
        <SessionProvider>
          <SessionCheckWrapper>
            <TenantProvider>{children}</TenantProvider>
          </SessionCheckWrapper>
        </SessionProvider>
      </App>
    </ConfigProvider>
  );
}
