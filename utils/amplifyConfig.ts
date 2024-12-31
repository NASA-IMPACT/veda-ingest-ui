import { Amplify } from 'aws-amplify';
import { config } from '@/utils/aws-exports';

export const configureAmplify = () => {
  Amplify.configure({ ...config }, { ssr: true });
}