import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
  beforeAll,
} from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStacExtensions } from '@/hooks/useStacExtensions';
import React from 'react';
import { App } from 'antd';

// --- Mocks ---
global.fetch = vi.fn();

// Wrapper component for App context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <App>{children}</App>
);

const mockDatacubeSchema = {
  title: 'Datacube Extension',
  definitions: {
    fields: {
      properties: {
        'cube:dimensions': {},
        'cube:variables': {},
      },
    },
    require_field: {
      required: ['cube:dimensions'],
    },
  },
};

describe('useStacExtensions', () => {
  let mockSetFormData: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetFormData = vi.fn();
    vi.mocked(fetch).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default empty state', () => {
    const { result } = renderHook(() =>
      useStacExtensions({ setFormData: mockSetFormData }),
      { wrapper }
    );
    expect(result.current.extensionFields).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it('should process a URL, fetch the schema, and update state on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockDatacubeSchema,
    } as Response);

    const { result } = renderHook(() =>
      useStacExtensions({ setFormData: mockSetFormData }),
      { wrapper }
    );

    act(() => {
      result.current.addExtension('http://example.com/datacube.json');
    });

    await waitFor(() => {
      expect(
        result.current.extensionFields['http://example.com/datacube.json']
      ).toBeDefined();
    });

    expect(mockSetFormData).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle fetch errors gracefully', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    const { result } = renderHook(() =>
      useStacExtensions({ setFormData: mockSetFormData }),
      { wrapper }
    );

    act(() => {
      result.current.addExtension('http://example.com/invalid.json');
    });

    await waitFor(() => {
      expect(
        result.current.extensionFields['http://example.com/invalid.json']
      ).toBeUndefined();
    });
  });

  it('should remove an extension when removeExtension is called', () => {
    const { result } = renderHook(() =>
      useStacExtensions({ setFormData: mockSetFormData }),
      { wrapper }
    );

    act(() => {
      result.current.extensionFields['http://example.com/datacube.json'] = {
        title: 'Datacube',
        fields: [{ name: 'cube:dimensions', required: true }],
      };
    });

    act(() => {
      result.current.removeExtension('http://example.com/datacube.json');
    });

    expect(
      result.current.extensionFields['http://example.com/datacube.json']
    ).toBeUndefined();
  });

  it('should not add a duplicate URL', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockDatacubeSchema,
    } as Response);

    const { result } = renderHook(() =>
      useStacExtensions({ setFormData: mockSetFormData }),
      { wrapper }
    );
    const url = 'http://example.com/schema.json';

    // First call
    act(() => {
      result.current.addExtension(url);
    });

    // Wait for the first call to complete and update the state
    await waitFor(() => {
      expect(result.current.extensionFields[url]).toBeDefined();
    });

    // Now, make the second call with the same URL
    act(() => {
      result.current.addExtension(url);
    });

    // Assert that fetch was not called again
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
