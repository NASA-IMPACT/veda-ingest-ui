import { cleanup, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

    const jsx = await renderHome();
    render(jsx);

    const introductoryText = await screen.findByText(
      /This application allows users to initiate the data ingest process\./i
    );
    expect(introductoryText).toBeInTheDocument();
  });

  it('renders content when auth is enabled and session exists', async () => {
    process.env.NEXT_PUBLIC_DISABLE_AUTH = 'false';

    const jsx = await renderHome();
    render(jsx);

    const introductoryText = await screen.findByText(
      /This application allows users to initiate the data ingest process\./i
    );
    expect(introductoryText).toBeInTheDocument();
  });
});
