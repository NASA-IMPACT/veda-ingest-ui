import { Suspense, lazy } from 'react';
import { Spin } from 'antd';
const Dashboard = lazy(() => import('./pages/Dashboard'));
import { Amplify } from 'aws-amplify';
import { withAuthenticator, ThemeProvider } from '@aws-amplify/ui-react';
import "./styles/styles.css";

import { SignInHeader } from './components/SignInHeader';

// import '@aws-amplify/ui/dist/style.css';

Amplify.configure({
  Auth: {
    Cognito: {
      //  Amazon Cognito User Pool ID
      userPoolId: 'us-west-2_0G3VRilt1',
      userPoolClientId: '2qaubmk2u5lcjsi8lhmoe4nr7m',
    }
  }
});

function App() {

  return (
    <ThemeProvider>
      <Suspense fallback={<Spin fullscreen/>}>
        <Dashboard />
      </Suspense>
    </ThemeProvider>

  );
}

export default withAuthenticator(App, {
  hideSignUp: true,
  components: {
    SignIn: {
      Header: SignInHeader,
    }
  }
});