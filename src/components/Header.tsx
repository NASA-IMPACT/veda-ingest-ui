import { Layout, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import React from 'react';

const { Header } = Layout;

import { logout } from '../services/authenticate';

const headerStyle: React.CSSProperties = {
  fontSize: '2em',
  fontFamily: '"Open Sans",sans-serif',
  fontWeight: 700,
  textAlign: 'center',
  lineHeight: '1.1',
  backgroundColor: '#2276AC',
  color: '#FFFFFF',
  width: '100%',
  marginBottom: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
};

const handleLogout = () => {
  logout();
};

const StyledHeader = ({ loggedIn = false }) => {
  if (!loggedIn) {
    return (
      <Header style={headerStyle}>Welcome to the VEDA Data Ingest UI</Header>
    );
  } else {
    return (
      <Header
        style={{
          ...headerStyle,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <div>{/* empty div to move logout button right */}</div>
        VEDA Data Ingest
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
        </Button>
      </Header>
    );
  }
};

export default StyledHeader;
