'use server';

import { signIn, signOut } from '@/auth';

export async function keycloakSignIn(callbackUrl: string) {
  await signIn('keycloak', { callbackUrl: '/create-dataset' });
}

export async function keycloakSignOut(callbackUrl: string) {
  await signOut({ redirect: false });
}
