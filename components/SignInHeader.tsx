import React from 'react';
import { Layout } from 'antd';
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
  justifyContent: 'center',
  flexDirection: 'column',
};

export function SignInHeader() {
  return <Header style={headerStyle}>Sign in to your Account</Header>;
}
