import '@ant-design/v5-patch-for-react-19';
import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import ClientSessionProvider from '@/components/ClientSessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'VEDA Ingest UI',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientSessionProvider>{children}</ClientSessionProvider>
      </body>
    </html>
  );
}
