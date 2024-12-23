import '@testing-library/jest-dom/vitest'

import { vi } from 'vitest';
import React from 'react';

// Mock Amplify configuration
vi.mock('aws-amplify', () => ({
  Amplify: {
    configure: vi.fn(),
  },
}));

// Mock components from AWS Amplify UI React
vi.mock('@aws-amplify/ui-react', () => ({
  withAuthenticator: (Component: React.ComponentType) => Component, // HOC typing
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, // ThemeProvider typing
}));

// Mock AppLayout
vi.mock('@/components/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock SignInHeader
vi.mock('@/components/SignInHeader', () => ({
  __esModule: true,
  SignInHeader: () => <div>Mock SignInHeader</div>, // Named export
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})