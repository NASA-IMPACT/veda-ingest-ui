import '@ant-design/v5-patch-for-react-19';
import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import 'leaflet/dist/leaflet.css';
import { SessionProvider } from 'next-auth/react';
import type { Metadata } from 'next';

import { ConfigProvider } from 'antd';
import theme from '@/theme/themeConfig';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VEDA Ingest UI',
  description: 'A user interface for VEDA data ingestion.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            <SessionProvider>{children}</SessionProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
