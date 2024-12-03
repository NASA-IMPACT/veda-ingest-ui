import './style.css';

import React from 'react';
import { Button, Layout } from 'antd';
import { signOut } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { withAuthenticator, ThemeProvider } from '@aws-amplify/ui-react';

import StyledHeader from '../components/Header';
import { SignInHeader } from '../components/SignInHeader';
import { Link } from '../components/Link.js';

Amplify.configure({
  Auth: {
    Cognito: {
      //  Amazon Cognito User Pool ID
      userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
    },
  },
});

const { Sider, Content } = Layout;

const siderStyle: React.CSSProperties = {
  textAlign: 'center',
  lineHeight: '120px',
  color: '#ffffff',
  backgroundColor: '#2276AC',
};

function LayoutDefault({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Layout>
        <StyledHeader />
        <Layout>
          <Sider width='20%' style={siderStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Link href='/'>Welcome</Link>
              <Link href='/dashboard'>Ingest New Data</Link>
            </div>
            <Button onClick={handleSignOut}>Sign out</Button>
            {''}
          </Sider>
          <Content>{children}</Content>
        </Layout>
      </Layout>
    </ThemeProvider>
  );
}

async function handleSignOut() {
  await signOut();
}

export default withAuthenticator(LayoutDefault, {
  hideSignUp: true,
  components: {
    SignIn: {
      Header: SignInHeader,
    },
  },
});
