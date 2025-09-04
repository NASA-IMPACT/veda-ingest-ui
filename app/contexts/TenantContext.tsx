'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Spin } from 'antd';
import { useSession } from 'next-auth/react';

interface TenantContextType {
  allowedTenants: string[];
  isLoading: boolean;
}

export const TenantContext = createContext<TenantContextType | undefined>(
  undefined
);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';

  const allowedTenants = session?.tenants || [];

  if (isLoading) {
    return <Spin fullscreen />;
  }

  return (
    <TenantContext.Provider value={{ allowedTenants, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useUserTenants = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useUserTenants must be used within a TenantProvider');
  }
  return context;
};
