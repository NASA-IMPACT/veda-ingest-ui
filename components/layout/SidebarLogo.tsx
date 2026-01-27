'use client';

import React from 'react';
import Image from 'next/image';
import { AlertFilled } from '@ant-design/icons/';
import { cfg } from '@/config/env';

interface SidebarLogoProps {
  collapsed: boolean;
}

const SidebarLogo = ({ collapsed }: SidebarLogoProps) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '20px',
        fontSize: '1.2em',
        textAlign: 'center',
        transition: 'all 0.2s',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Image
          src="/icon.svg"
          alt="VEDA Ingest UI Logo"
          width={32}
          height={32}
        />
        {!collapsed && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              marginLeft: '12px',
            }}
          >
            <span>VEDA Ingest UI</span>
            {cfg.ADDITIONAL_LOGO === 'disasters' && (
              <Image
                src="/Disasters_Wordmark_White.svg"
                alt="Disasters Wordmark"
                width={120}
                height={24}
                style={{ marginTop: 8, marginLeft: -10 }}
              />
            )}
            {cfg.ADDITIONAL_LOGO === 'eic' && (
              <Image
                src="/Earth_Information_Center.svg"
                alt="Earth Information Center Wordmark"
                width={120}
                height={48}
                style={{ marginTop: 8, marginLeft: 0 }}
              />
            )}
          </div>
        )}
      </div>

      {!collapsed &&
        (process.env.NEXT_PUBLIC_MOCK_TENANTS ||
          process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' ||
          process.env.NEXT_PUBLIC_MOCK_SCOPES) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 12,
              color: '#faad14',
            }}
          >
            <AlertFilled style={{ marginRight: 8 }} />
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
              }}
            >
              {process.env.NEXT_PUBLIC_MOCK_TENANTS && (
                <div>
                  Mocking Tenants: {process.env.NEXT_PUBLIC_MOCK_TENANTS}
                </div>
              )}
              {process.env.NEXT_PUBLIC_MOCK_SCOPES && (
                <div>Mocking Scopes: {process.env.NEXT_PUBLIC_MOCK_SCOPES}</div>
              )}
              {process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' && (
                <div>Mocking Auth</div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default SidebarLogo;
