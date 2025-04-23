'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface ClientSessionProviderProps {
  children: React.ReactNode;
}

function ClientSessionProvider({ children }: ClientSessionProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}

export default ClientSessionProvider;
