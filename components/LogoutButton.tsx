import React from 'react';
import { Button, Tooltip } from 'antd';

import { signOut } from 'aws-amplify/auth';
import { LogoutOutlined } from '@ant-design/icons';

async function handleSignOut() {
  await signOut();
}

const collapsedStyle = {
  marginTop: '16px',
  width: 'calc(100% - 24px)',
  marginInline: '12px',
  justifyContent: 'center',
};

const expandedStyle = {
  marginTop: '16px',
  width: 'calc(100% - 90px)',
  marginInline: '45px',
  justifyContent: 'flex-start',
};

const LogoutButton = ({ collapsed }: { collapsed: boolean }) => {
  return (
    <Tooltip placement="right" title={collapsed ? 'Sign out' : ''}>
      <Button
        variant="solid"
        color="danger"
        onClick={handleSignOut}
        icon={<LogoutOutlined />}
        block
        style={collapsed ? collapsedStyle : expandedStyle}
      >
        {collapsed ? '' : 'Sign out'}
      </Button>
    </Tooltip>
  );
};

export default LogoutButton;
