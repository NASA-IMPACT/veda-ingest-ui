'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider, App } from 'antd';
import { TenantProvider } from '@/app/contexts/TenantContext';
import theme from '@/theme/themeConfig';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={theme}>
      <App>
        <SessionProvider>
          <TenantProvider>{children}</TenantProvider>
        </SessionProvider>
      </App>
    </ConfigProvider>
  );
}
