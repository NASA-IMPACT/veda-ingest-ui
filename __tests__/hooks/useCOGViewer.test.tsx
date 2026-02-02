import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCOGViewer } from '@/hooks/useCOGViewer';
import React from 'react';
import { App } from 'antd';

// --- Mocks ---
global.fetch = vi.fn();

vi.mock('leaflet', () => ({
  map: vi.fn(() => ({
    fitBounds: vi.fn(),
  })),
  latLngBounds: vi.fn(),
}));

// Wrapper component for App context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <App>{children}</App>
);

// --- Test Data ---
const mockCogUrl = 'https://example.com/cog.tif';
const mockInfoData = {
  band_descriptions: [
    [1, 'Red'],
    [2, 'Green'],
    [3, 'Blue'],
  ],
};
const mockTileJsonData = {
  tiles: ['https://example.com/cog/tiles/{z}/{x}/{y}@1x?url=...'],
  bounds: [-180, -90, 180, 90],
};

describe('useCOGViewer', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with the correct default state', () => {
    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    expect(result.current.cogUrl).toBeNull();
    expect(result.current.metadata).toBeNull();
    expect(result.current.tileUrl).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should fetch metadata and tile URL successfully', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInfoData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTileJsonData,
      } as Response);

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchMetadata(mockCogUrl);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.metadata).toEqual(mockInfoData);
      expect(result.current.selectedBands).toEqual([1]);
      expect(result.current.tileUrl).toBe(mockTileJsonData.tiles[0]);
    });
  });

  it('should use `renders` prop to override defaults', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInfoData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTileJsonData,
      } as Response);

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    const rendersProp = {
      bidx: [3, 2, 1],
      colormap_name: 'pretty_color',
    };

    await act(async () => {
      await result.current.fetchMetadata(mockCogUrl, rendersProp);
    });

    await waitFor(() => {
      expect(result.current.selectedBands).toEqual([3, 2, 1]);
      expect(result.current.selectedColormap).toBe('pretty_color');
    });

    const tileUrlFetchCall = vi.mocked(fetch).mock.calls[1][0];
    expect(tileUrlFetchCall).toContain('&bidx=3&bidx=2&bidx=1');
    expect(tileUrlFetchCall).toContain('&colormap_name=pretty_color');
  });

  it('should handle errors when fetching metadata fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Server connection failed' }),
    } as Response);

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchMetadata(mockCogUrl);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.metadata).toBeNull();
    });
  });

  it('should handle empty URL in fetchMetadata', async () => {
    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchMetadata('');
    });

    expect(result.current.metadata).toBeNull();
  });

  it('should handle "No such file or directory" error pattern', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        detail: '/path/to/file.tif: No such file or directory',
      }),
    } as Response);

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchMetadata(mockCogUrl);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle non-500 error status codes', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response);

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchMetadata(mockCogUrl);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle error when json() fails on error response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as any as Response);

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchMetadata(mockCogUrl);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle non-Error thrown in catch block', async () => {
    vi.mocked(fetch).mockRejectedValue('String error');

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchMetadata(mockCogUrl);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle invalid JSON in renders parameter', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInfoData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTileJsonData,
      } as Response);

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchMetadata(mockCogUrl, '{invalid json}');
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error parsing renders:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle renders as object (not string)', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInfoData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTileJsonData,
      } as Response);

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    const rendersObject = {
      bidx: [2, 1],
      rescale: [[0, 100]],
      colormap_name: 'viridis',
      color_formula: 'Gamma RGB 3.5 Saturation 1.7 Sigmoidal RGB 15 0.35',
      resampling: 'bilinear',
      nodata: '-9999',
    };

    await act(async () => {
      await result.current.fetchMetadata(mockCogUrl, rendersObject);
    });

    await waitFor(() => {
      expect(result.current.selectedBands).toEqual([2, 1]);
      expect(result.current.rescale).toEqual([[0, 100]]);
      expect(result.current.selectedColormap).toBe('viridis');
      expect(result.current.colorFormula).toBe(
        'Gamma RGB 3.5 Saturation 1.7 Sigmoidal RGB 15 0.35'
      );
      expect(result.current.selectedResampling).toBe('bilinear');
      expect(result.current.noDataValue).toBe('-9999');
    });
  });

  it('should handle fetchTileUrl with all optional parameters', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockTileJsonData,
    } as Response);

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchTileUrl(
        mockCogUrl,
        [1, 2, 3],
        [
          [0, 255],
          [10, 200],
        ],
        'viridis',
        'Gamma RGB 3',
        'bilinear',
        '-9999'
      );
    });

    await waitFor(() => {
      expect(result.current.tileUrl).toBe(mockTileJsonData.tiles[0]);
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchCall).toContain('&bidx=1&bidx=2&bidx=3');
    expect(fetchCall).toContain('&rescale=0,255');
    expect(fetchCall).toContain('&rescale=10,200');
    expect(fetchCall).toContain('&colormap_name=viridis');
    expect(fetchCall).toContain('&color_formula=Gamma%20RGB%203');
    expect(fetchCall).toContain('&resampling=bilinear');
    expect(fetchCall).toContain('&nodata=-9999');
  });

  it('should handle fetchTileUrl with Internal colormap (no param)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockTileJsonData,
    } as Response);

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchTileUrl(
        mockCogUrl,
        [1],
        [[null, null]],
        'Internal',
        null,
        null,
        null
      );
    });

    await waitFor(() => {
      expect(result.current.tileUrl).toBe(mockTileJsonData.tiles[0]);
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchCall).not.toContain('&colormap_name');
    expect(fetchCall).not.toContain('&color_formula');
    expect(fetchCall).not.toContain('&resampling');
    expect(fetchCall).not.toContain('&nodata');
  });

  it('should handle fetchTileUrl error when URL is missing', async () => {
    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchTileUrl('', [1], [[null, null]], 'Internal');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle fetchTileUrl network error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchTileUrl(
        mockCogUrl,
        [1],
        [[null, null]],
        'Internal'
      );
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should filter out null rescale values', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockTileJsonData,
    } as Response);

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    await act(async () => {
      await result.current.fetchTileUrl(
        mockCogUrl,
        [1],
        [
          [null, null],
          [0, 255],
          [null, 100],
        ],
        'Internal'
      );
    });

    await waitFor(() => {
      expect(result.current.tileUrl).toBe(mockTileJsonData.tiles[0]);
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
    // Should only include the [0, 255] rescale, not the ones with null
    expect(fetchCall).toContain('&rescale=0,255');
    expect(fetchCall).not.toContain('null');
  });

  it('should set map bounds when mapRef and bounds are present', async () => {
    const mockBounds = [-180, -90, 180, 90];
    const mockTileDataWithBounds = {
      ...mockTileJsonData,
      bounds: mockBounds,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockTileDataWithBounds,
    } as Response);

    const mockFitBounds = vi.fn();
    const mockMapRef = {
      current: {
        fitBounds: mockFitBounds,
      },
    };

    const { result } = renderHook(() => useCOGViewer(), { wrapper });

    // Set the mapRef before calling fetchTileUrl
    result.current.mapRef.current = mockMapRef.current as any;

    await act(async () => {
      await result.current.fetchTileUrl(
        mockCogUrl,
        [1, 2, 3],
        [[0, 255]],
        'Internal'
      );
    });

    await waitFor(() => {
      expect(result.current.tileUrl).toBe(mockTileDataWithBounds.tiles[0]);
    });

    // The Leaflet import is dynamic, so we need to wait a bit for it
    await new Promise((resolve) => setTimeout(resolve, 100));

    await waitFor(() => {
      expect(mockFitBounds).toHaveBeenCalled();
    });
  });
});
