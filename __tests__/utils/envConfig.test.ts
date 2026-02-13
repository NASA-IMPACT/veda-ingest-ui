import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('config/env.ts', () => {
  const ORIGINAL_ENV = { ...process.env } as NodeJS.ProcessEnv;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_APP_ENV;
  });

  it('defaults to local profile when NEXT_PUBLIC_APP_ENV is unset', async () => {
    vi.resetModules();
    const { cfg } = await import('@/config/env');
    expect(cfg.OWNER).toBe('nasa-impact');
    expect(cfg.REPO).toBe('veda-ingest-ui-testing');
    expect(cfg.TARGET_BRANCH).toBe('main');
    expect(cfg.AWS_REGION).toBe('us-west-2');
    expect(cfg.NEXT_PUBLIC_AWS_S3_BUCKET_NAME).toBe('veda-thumbnails');
  });

  it('selects veda profile when NEXT_PUBLIC_APP_ENV=veda', async () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'veda';
    vi.resetModules();
    const { cfg } = await import('@/config/env');
    expect(cfg.REPO).toBe('veda-data');
    expect(cfg.NEXT_PUBLIC_AWS_S3_BUCKET_NAME).toBe('veda-thumbnails');
  });

  it('selects disasters profile when NEXT_PUBLIC_APP_ENV=disasters', async () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'disasters';
    vi.resetModules();
    const { cfg } = await import('@/config/env');
    expect(cfg.REPO).toBe('disaster-data');
    expect(cfg.NEXT_PUBLIC_AWS_S3_BUCKET_NAME).toBe('veda-thumbnails');
  });
});
