import { Layout } from 'antd';
import React from 'react';

const { Header } = Layout;

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
  justifyContent: 'space-between',
  flexDirection: 'row',
};

const StyledHeader = () => {
  return (
    <Header style={headerStyle}>
      <Logo />
      VEDA Data Ingest UI
      <div>{/* empty div to center text */}</div>
    </Header>
  );
};

function Logo() {
  return (
    <div
      style={{
        marginTop: 20,
        marginBottom: 10,
      }}
    >
    </div>
  );
}

export default StyledHeader;