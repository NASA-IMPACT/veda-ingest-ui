import { vi } from 'vitest';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function createMockRouter(
  overrides: Partial<AppRouterInstance> = {}
): AppRouterInstance {
  return {
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    ...overrides,
  } as unknown as AppRouterInstance;
}
