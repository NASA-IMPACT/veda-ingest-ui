import React from 'react';
import { Button } from 'antd';

import { signOut } from 'aws-amplify/auth';
import { LogoutOutlined } from '@ant-design/icons'

async function handleSignOut() {
  await signOut();
}

const LogoutButton = ({collapsed}: {collapsed: boolean}) => {
  return (
    <Button
    type='primary'
    danger
    onClick={handleSignOut}
    icon={<LogoutOutlined/>}
    block
    style={{
      width: 'calc(100% - 8px)',
      marginInline: '4px',
    }}
    >{collapsed ? '' : 'Sign out'}</Button>

  )
}

export default LogoutButton