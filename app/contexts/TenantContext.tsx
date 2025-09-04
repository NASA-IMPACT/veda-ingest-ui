'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Spin } from 'antd';

interface TenantContextType {
  allowedTenants: string[] | null;
  isLoading: boolean;
}

export const TenantContext = createContext<TenantContextType | undefined>(
  undefined
);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [allowedTenants, setAllowedTenants] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserTenants = async () => {
      try {
        const response = await fetch('/api/tenants');
        if (!response.ok) throw new Error('Failed to fetch tenants');
        const tenants: string[] = await response.json();
        setAllowedTenants(tenants);
      } catch (error) {
        console.error("Could not fetch user's tenants:", error);
        setAllowedTenants([]); // Default to empty list on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserTenants();
  }, []);

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
