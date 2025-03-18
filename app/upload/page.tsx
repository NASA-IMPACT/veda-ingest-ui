'use client';

import AppLayout from '@/components/Layout';
import { Amplify } from 'aws-amplify';
import { config } from '@/utils/aws-exports';
import { SignInHeader } from '@/components/SignInHeader';
import { withConditionalAuthenticator } from '@/utils/withConditionalAuthenticator';
import ThumbnailUploader from '@/components/ThumbnailUploader';

Amplify.configure({ ...config }, { ssr: true });

function UploadPage() {
  return (
    <AppLayout>
      <ThumbnailUploader />
    </AppLayout>
  );
}

export default withConditionalAuthenticator(UploadPage, {
  hideSignUp: true,
  components: {
    SignIn: {
      Header: SignInHeader,
    },
  },
});
