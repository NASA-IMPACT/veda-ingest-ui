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
    const fetchTenants = async () => {
      if (status === 'loading') {
        return;
      }
      if (!session) {
        setAllowedTenants([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetch('/api/allowed-tenants');
        if (res.ok) {
          const data = (await res.json()) as { tenants?: string[] };
          const tenants = Array.isArray(data.tenants) ? data.tenants : [];
          setAllowedTenants(tenants);
        } else {
          setAllowedTenants([]);
        }
      } catch {
        setAllowedTenants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
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
