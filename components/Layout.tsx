import React, { ReactNode, useState } from 'react';
import { Layout } from 'antd';

import MenuBar from '@/components/MenuBar';
import LogoutButton from '@/components/LogoutButton';

const { Content, Sider } = Layout;

const AppLayout = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '20px',
            width: 'calc(100% - 8px)',
            fontSize: '1.5em',
            textAlign: 'center',
          }}
        >
          VEDA Ingest UI
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
