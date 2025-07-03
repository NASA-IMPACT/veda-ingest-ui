import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCOGViewer } from '@/hooks/useCOGViewer';
import { message } from 'antd';

// --- Mocks ---
global.fetch = vi.fn();

vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('leaflet', () => ({
  map: vi.fn(() => ({
    fitBounds: vi.fn(),
  })),
  latLngBounds: vi.fn(),
}));

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
    vi.mocked(message.success).mockClear();
    vi.mocked(message.error).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with the correct default state', () => {
    const { result } = renderHook(() => useCOGViewer());

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

    const { result } = renderHook(() => useCOGViewer());

    await act(async () => {
      await result.current.fetchMetadata(mockCogUrl);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.metadata).toEqual(mockInfoData);
      expect(result.current.selectedBands).toEqual([1]);
      expect(result.current.tileUrl).toBe(mockTileJsonData.tiles[0]);
    });

    expect(message.success).toHaveBeenCalledWith(
      'COG metadata loaded successfully!'
    );
    expect(message.success).toHaveBeenCalledWith(
      'COG tile layer loaded successfully!'
    );
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

    const { result } = renderHook(() => useCOGViewer());

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

    const { result } = renderHook(() => useCOGViewer());

    await act(async () => {
      await result.current.fetchMetadata(mockCogUrl);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.metadata).toBeNull();
      expect(message.error).toHaveBeenCalledWith(
        'Server Error: Server connection failed'
      );
    });
  });
});
