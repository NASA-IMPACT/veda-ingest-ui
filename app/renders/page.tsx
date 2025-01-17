'use client';

import AppLayout from '@/components/Layout';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { config } from '@/utils/aws-exports';
import { SignInHeader } from '@/components/SignInHeader';

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically load the COGOverlay component to prevent SSR issues
const COGViewer = dynamic(() => import('@/components/COGViewer'), {
  ssr: false,
});

Amplify.configure({ ...config }, { ssr: true });


const Renders = function Renders() {

  return (
    <AppLayout>
      <COGViewer/>
    </AppLayout>
  );
};

export default withAuthenticator(Renders, {
  hideSignUp: true,
  components: {
    SignIn: {
      Header: SignInHeader,
    },
  },
});
