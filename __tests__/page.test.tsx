import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionProvider } from 'next-auth/react';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockPrefetch = vi.fn();
const mockBack = vi.fn();
const mockForward = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
    forward: mockForward,
  }),
  usePathname: vi.fn().mockReturnValue('/'),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}));

describe('Home Page', () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_DISABLE_AUTH; // Ensure a clean slate

    mockPush.mockClear();
    mockReplace.mockClear();
    mockPrefetch.mockClear();
    mockBack.mockClear();
    mockForward.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    cleanup();
  });

  describe('when NEXT_PUBLIC_DISABLE_AUTH is "true"', () => {
    it('renders the main content regardless of session status', async () => {
      process.env.NEXT_PUBLIC_DISABLE_AUTH = 'true';
      const { default: Home } = await import('@/app/page');

      render(
        <SessionProvider session={null}>
          <Home />
        </SessionProvider>
      );
      const introductoryText = await screen.findByText(
        /This application allows users to initiate the data ingest process\./i
      );
      expect(introductoryText).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    }, 10000);
  });

  describe('when NEXT_PUBLIC_DISABLE_AUTH is "false" (or not set)', () => {
    it('shows spinner and calls router.push for an unauthenticated user', async () => {
      process.env.NEXT_PUBLIC_DISABLE_AUTH = 'false';
      const { default: Home } = await import('@/app/page');

      const { container } = render(
        <SessionProvider session={null}>
          <Home />
        </SessionProvider>
      );

      const spinnerElement = container.querySelector(
        '.ant-spin[aria-busy="true"]'
      );
      expect(spinnerElement).toBeInTheDocument();

      expect(
        screen.queryByText(
          /This application allows users to initiate the data ingest process\./i
        )
      ).not.toBeInTheDocument();

      await vi.waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    }, 7000);

    it('renders main content for an authenticated user', async () => {
      process.env.NEXT_PUBLIC_DISABLE_AUTH = 'false';
      const { default: Home } = await import('@/app/page');

      const mockUserSession = {
        user: { name: 'Test User', email: 'test@example.com', id: '123' },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      render(
        <SessionProvider session={mockUserSession}>
          <Home />
        </SessionProvider>
      );
      const introductoryText = await screen.findByText(
        /This application allows users to initiate the data ingest process\./i
      );
      expect(introductoryText).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    }, 7000);
  });
});
