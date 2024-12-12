import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { config } from '@/utils/aws-exports';

export const { runWithAmplifyServerContext } = createServerRunner({
  config,
});
