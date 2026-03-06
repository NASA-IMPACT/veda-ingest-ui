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
  tenants: string[];
  isLoading: boolean;
}

export const TenantContext = createContext<TenantContextType | undefined>(
  undefined
);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [tenants, setTenants] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);

    if (!session) {
      setTenants([]);
      return;
    }

    const sessionTenants = (session as any)?.tenants;
    const tenants = Array.isArray(sessionTenants) ? sessionTenants : [];
    setTenants(tenants);
  }, [session, status]);

  if (isLoading) {
    return <Spin fullscreen />;
  }

  return (
    <TenantContext.Provider value={{ tenants, isLoading }}>
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
