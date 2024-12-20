import React from 'react';
import { Layout } from 'antd';
const { Header } = Layout;

// Styled header for AWS Cognito Login //
const headerStyle: React.CSSProperties = {
  fontSize: '2em',
  fontFamily: '"Open Sans",sans-serif',
  fontWeight: 700,
  textAlign: 'center',
  lineHeight: '1.1',
  backgroundColor: '#1677ff',
  color: '#FFFFFF',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: '1.5em 1.5em',
};

export function SignInHeader() {
  return <Header style={headerStyle}>VEDA Data Ingest</Header>;
}
