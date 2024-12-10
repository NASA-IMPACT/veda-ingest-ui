import React from 'react';
import { Button, Tooltip } from 'antd';

import { signOut } from 'aws-amplify/auth';
import { LogoutOutlined } from '@ant-design/icons'

async function handleSignOut() {
  await signOut();
}

const LogoutButton = ({collapsed}: {collapsed: boolean}) => {
  return (
    <Tooltip placement="right" title={collapsed ? 'Sign out' : ''} >
      <Button
      type='primary'
      danger
      onClick={handleSignOut}
      icon={<LogoutOutlined/>}
      block
      style={{
        width: 'calc(100% - 8px)',
        marginInline: '4px',
        marginTop: '16px',
      }}>
        {collapsed ? '' : 'Sign out'}
        </Button>
      </Tooltip>
  )
}

export default LogoutButton