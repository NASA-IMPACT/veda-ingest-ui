import { vi } from 'vitest';
import type { Session } from 'next-auth';

export type TestSession = {
  expires: string;
  scopes: string[];
  user: {
    name: string;
    email: string;
  };
};

export function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    user: {
      name: 'Test User',
      email: 'test@example.com',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  } as Session;
}

// Mock return type for useSession - accepts partial overrides
export function createMockSessionReturn(
  dataOverrides: Partial<Session> = {},
  status: 'authenticated' | 'unauthenticated' | 'loading' = 'authenticated'
) {
  if (status === 'unauthenticated') {
    return {
      data: null,
      status: 'unauthenticated' as const,
      update: vi.fn(),
    };
  }

  if (status === 'loading') {
    return {
      data: null,
      status: 'loading' as const,
      update: vi.fn(),
    };
  }

  return {
    data: createMockSession(dataOverrides),
    status: 'authenticated' as const,
    update: vi.fn(),
  };
}
