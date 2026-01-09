'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from 'react';
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
  const [allowedTenants, setAllowedTenants] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);

    if (!session) {
      setAllowedTenants([]);
      return;
    }

    const sessionAllowedTenants = (session as any)?.allowedTenants;
    const tenants = Array.isArray(sessionAllowedTenants)
      ? sessionAllowedTenants
      : [];
    setAllowedTenants(tenants);
  }, [session, status]);

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
