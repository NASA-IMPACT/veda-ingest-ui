'use client';

import React from 'react';
import { Button, Tooltip } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { keycloakSignOut } from '@/app/actions/auth';

const collapsedStyle = {
  marginTop: '16px',
  width: 'calc(100% - 24px)',
  marginInline: '12px',
  justifyContent: 'center',
};

const expandedStyle = {
  marginTop: '16px',
  width: 'calc(100% - 48px)',
  marginInline: '24px',
  justifyContent: 'flex-start',
};

interface LogoutButtonProps {
  collapsed: boolean;
}

const LogoutButton = ({ collapsed }: LogoutButtonProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const callbackUrl = searchParams.get('callbackUrl') || '/login';

  const handleLogout = () => {
    startTransition(async () => {
      await keycloakSignOut(callbackUrl);
      const keycloakLogoutUrl = `${process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(window.location.origin + callbackUrl)}`;
      window.location.href = keycloakLogoutUrl;
    });
  };

  return (
    <Tooltip placement="right" title={collapsed ? 'Sign out' : ''}>
      <Button
        type="primary" // Changed from variant="solid" and color="danger" for Ant Design Button
        danger
        onClick={handleLogout}
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
