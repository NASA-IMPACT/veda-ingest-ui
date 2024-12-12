'use client';

import { Amplify } from 'aws-amplify';
import { config } from '@/utils/aws-exports';
import '@aws-amplify/ui-react/styles.css';

// @ts-expect-error something
Amplify.configure({ ...config, ssr: true });
export default function AmplifyProvider({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}
