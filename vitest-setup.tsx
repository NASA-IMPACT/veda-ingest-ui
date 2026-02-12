import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';
import React from 'react';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Ant Design's responsive observer
vi.mock('antd/_util/responsiveObserver', () => ({
  __esModule: true,
  default: {
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    unsubscribe: vi.fn(),
  },
}));

// Mock AppLayout
vi.mock('@/components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => '/',
  };
});
