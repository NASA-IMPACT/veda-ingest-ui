'use client'

import { Space } from 'antd';
import { Amplify } from 'aws-amplify';
import { withAuthenticator, ThemeProvider } from '@aws-amplify/ui-react';


import { SignInHeader } from '../components/SignInHeader';
import AppLayout from '../components/Layout';


Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
    },
  },
});


const Home = function Home() {
  return (
    <ThemeProvider>
      <AppLayout>
      <section style={{ textAlign: 'center', marginTop: 48, marginBottom: 40, padding: 100 }}>
        <Space align='start'>
          This application allows users to initiate the data ingest process.
        </Space>
      </section>
      </AppLayout>
    </ThemeProvider>
  );
}


export default withAuthenticator(Home, {
  hideSignUp: true,
  components: {
    SignIn: {
      Header: SignInHeader,
    },
  },
});