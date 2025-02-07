import { withAuthenticator } from '@aws-amplify/ui-react';

const isAuthDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

export function withConditionalAuthenticator(
  Component: React.ComponentType<any>,
  options?: any
) {
  // If authentication is disabled, return the component directly
  if (isAuthDisabled) {
    return Component;
  }

  // Otherwise, wrap with `withAuthenticator`
  return withAuthenticator(Component, options);
}
