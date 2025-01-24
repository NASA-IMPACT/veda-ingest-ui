'use client';

import { Space } from 'antd';
import { Amplify } from 'aws-amplify';
import { withAuthenticator, ThemeProvider } from '@aws-amplify/ui-react';
import { config } from '@/utils/aws-exports';

import { SignInHeader } from '@/components/SignInHeader';
import AppLayout from '@/components/Layout';
import { withConditionalAuthenticator } from '@/utils/withConditionalAuthenticator';

Amplify.configure({ ...config }, { ssr: true });



const Home = function Home() {
  return (
    <ThemeProvider>
      <AppLayout>
        <section
          style={{
            textAlign: 'center',
            marginTop: 48,
            marginBottom: 40,
            padding: 100,
          }}
        >
          <Space align="start">
            This application allows users to initiate the data ingest process.
          </Space>
        </section>
      </AppLayout>
    </ThemeProvider>
  );
};

export default withConditionalAuthenticator(Home, {
  hideSignUp: true,
  components: {
    SignIn: {
      Header: SignInHeader,
    },
  },
});
