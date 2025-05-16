import '@ant-design/v5-patch-for-react-19';
import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import 'leaflet/dist/leaflet.css';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'VEDA Ingest UI',
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
          <SessionProvider>{children}</SessionProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
