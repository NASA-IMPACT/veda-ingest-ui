import { cleanup, render, screen } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

const renderHome = async () => {
  const { default: Home } = await import('@/app/page');
  return await Home();
};

describe('Home component', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_DISABLE_AUTH;
  });

  afterEach(() => {
    process.env = originalEnv;
    cleanup();
  });

  it('renders without auth when NEXT_PUBLIC_DISABLE_AUTH is true', async () => {
    process.env.NEXT_PUBLIC_DISABLE_AUTH = 'true';

    const jsx = await renderHome();
    render(jsx);

    const introductoryText = await screen.findByText(
      /This application allows users to initiate the data ingest process\./i
    );
    expect(introductoryText).toBeInTheDocument();
  }, 20000); // this test is slow

  it('redirects to /login if auth is enabled and no session exists', async () => {
    process.env.NEXT_PUBLIC_DISABLE_AUTH = 'false';

    const { auth } = await import('@/auth');
    const { redirect } = await import('next/navigation');

    (vi.mocked(auth, true) as unknown as Mock).mockResolvedValue(null);

    await renderHome();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renders content when auth is enabled and session exists', async () => {
    process.env.NEXT_PUBLIC_DISABLE_AUTH = 'false';

    const { auth } = await import('@/auth');
    (vi.mocked(auth, true) as unknown as Mock).mockResolvedValue({
      user: 'test-user',
    });

    const jsx = await renderHome();
    render(jsx);

    const introductoryText = await screen.findByText(
      /This application allows users to initiate the data ingest process\./i
    );
    expect(introductoryText).toBeInTheDocument();
  });
});
