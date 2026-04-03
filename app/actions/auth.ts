'use server';

import { signIn, signOut } from '@/auth';

export async function keycloakSignIn(callbackUrl: string) {
  void callbackUrl;
  await signIn('keycloak', { callbackUrl: '/create-dataset' });
}

export async function keycloakSignOut(callbackUrl: string) {
  void callbackUrl;
  await signOut({ redirect: false });
}
