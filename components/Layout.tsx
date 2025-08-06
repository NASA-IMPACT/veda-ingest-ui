'use client';

import React, { ReactNode, useState } from 'react';
import { Divider, Layout } from 'antd';
import Image from 'next/image';

import MenuBar from '@/components/MenuBar';
import dynamic from 'next/dynamic';

const LogoutButton = dynamic(() => import('@/components/LogoutButton'), {
  ssr: false,
});

const { Content, Sider } = Layout;

const AppLayout = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        width={220}
        collapsedWidth={80}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '20px',
            height: '74px',
            fontSize: '1.2em',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
        >
          <Image
            src="/icon.svg"
            alt="VEDA Ingest UI Logo"
            width={32}
            height={32}
          />
          {!collapsed && (
            <span style={{ marginLeft: '12px' }}>VEDA Ingest UI</span>
          )}
        </div>
        <MenuBar />
        <LogoutButton collapsed={collapsed} />
      </Sider>
      <Layout>
        <Content style={{ margin: '24px 16px 0' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
