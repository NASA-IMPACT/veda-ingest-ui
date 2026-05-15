import { useState, useReducer, useRef, useCallback } from 'react';
import { App } from 'antd';
import { VEDA_BACKEND_URL } from '@/config/env';
import { logFrontend, logFrontendError } from '@/lib/structuredLogger';
import { Map as LeafletMap } from 'leaflet';
import {
  type ColormapType,
  colormapReducer,
  initialColormapState,
} from '@/components/COGViewer/colormapReducer';

type RendersType = {
  bidx?: number[];
  rescale?: [number, number][];
  colormap_name?: string;
  colormap?: unknown;
  color_formula?: string;
  resampling?: string;
  nodata?: string;
  assets?: string[];
  title?: string;
};

type COGMetadata = {
  band_descriptions?: Array<[string | number, string]>;
  [key: string]: unknown;
};

type TileJsonResponse = {
  tiles: string[];
  bounds?: [number, number, number, number];
};

const getDefaultBands = (metadata: COGMetadata): number[] => {
  const totalBands = metadata.band_descriptions?.length ?? 0;

  if (totalBands <= 1) {
    return [1];
  }

  return Array.from({ length: Math.min(totalBands, 3) }, (_, i) => i + 1);
};

const fetchTileJson = async (
  url: string,
  bands: number[],
  rescale: [number | null, number | null][],
  colormap: string,
  colorFormula?: string | null,
  resampling?: string | null,
  noData?: string | null,
  colormapType: ColormapType = 'named',
  customColormapJson?: string | null
): Promise<TileJsonResponse> => {
  if (!url) throw new Error('COG URL is required.');

  const bidxParams = bands.map((band) => `&bidx=${band}`).join('');
  const rescaleParams = rescale
    .filter((range) => range[0] !== null && range[1] !== null)
    .map((range) => `&rescale=${range[0]},${range[1]}`)
    .join('');
  let colormapParam = '';
  if (colormapType === 'custom') {
    if (!customColormapJson?.trim()) {
      throw new Error('Custom colormap JSON is required when mode is custom.');
    }

    let parsedColormap: unknown;
    try {
      parsedColormap = JSON.parse(customColormapJson);
    } catch {
      throw new Error('Custom colormap must be valid JSON.');
    }

    if (typeof parsedColormap !== 'object' || parsedColormap === null) {
      throw new Error('Custom colormap must be a JSON object.');
    }

    colormapParam = `&colormap=${encodeURIComponent(JSON.stringify(parsedColormap))}`;
  } else if (colormap !== 'Internal') {
    colormapParam = `&colormap_name=${encodeURIComponent(colormap)}`;
  }
  const colorFormulaParam = colorFormula
    ? `&color_formula=${encodeURIComponent(colorFormula)}`
    : '';
  const resamplingParam = resampling ? `&resampling=${resampling}` : '';
  const noDataParam = noData ? `&nodata=${encodeURIComponent(noData)}` : '';

  const response = await fetch(
    `${VEDA_BACKEND_URL}/raster/cog/WebMercatorQuad/tilejson.json?url=${encodeURIComponent(url)}${bidxParams}${rescaleParams}${colormapParam}${colorFormulaParam}${resamplingParam}${noDataParam}`
  );

  if (!response.ok) throw new Error('Failed to fetch tile URL');
  return response.json() as Promise<TileJsonResponse>;
};

export const useCOGViewer = () => {
  const { message } = App.useApp();
  const [cogUrl, setCogUrl] = useState<string | null>(null);
  const [renders, setRenders] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<COGMetadata | null>(null);
  const [selectedBands, setSelectedBands] = useState<number[]>([]);
  const [rescale, setRescale] = useState<[number | null, number | null][]>([]);
  const [colormap, dispatchColormap] = useReducer(
    colormapReducer,
    initialColormapState
  );
  const [colorFormula, setColorFormula] = useState<string | null>(null);
  const [selectedResampling, setSelectedResampling] = useState<string | null>(
    null
  );
  const [noDataValue, setNoDataValue] = useState<string | null>(null);
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  const fetchTileUrl = useCallback(
    async (
      url: string,
      bands: number[],
      rescale: [number | null, number | null][],
      colormap: string,
      colorFormula?: string | null,
      resampling?: string | null,
      noData?: string | null,
      colormapType: ColormapType = 'named',
      customColormapJson?: string | null
    ) => {
      setLoading(true);
      try {
        const data = await fetchTileJson(
          url,
          bands,
          rescale,
          colormap,
          colorFormula,
          resampling,
          noData,
          colormapType,
          customColormapJson
        );
        setTileUrl(data.tiles[0]);

        const bounds = data.bounds;
        if (mapRef.current && bounds) {
          import('leaflet').then((L) => {
            mapRef.current?.fitBounds(
              L.latLngBounds([
                [bounds[1], bounds[0]],
                [bounds[3], bounds[2]],
              ])
            );
          });
        }

        message.success('COG tile layer loaded successfully!');
      } catch (error) {
        logFrontendError('cog.viewer.fetch_tile_url_failed', error, {
          endpoint: 'raster/cog/WebMercatorQuad/tilejson.json',
        });
        if (error instanceof Error) {
          message.error(error.message);
        } else {
          message.error('Failed to load tile layer.');
        }
      } finally {
        setLoading(false);
      }
    },
    [message, mapRef]
  );

  const fetchMetadata = useCallback(
    async (url: string, renders?: string | RendersType | null) => {
      if (!url) {
        logFrontend('warn', 'cog.viewer.metadata_missing_url', {
          endpoint: 'raster/cog/info',
        });
        message.error('COG URL is required');
        return;
      }
      setLoading(true);

      try {
        const response = await fetch(
          `${VEDA_BACKEND_URL}/raster/cog/info?url=${encodeURIComponent(url)}`
        );
        if (!response.ok) {
          const errorMessage = await response.json().catch(() => null);

          if (response.status === 500 && errorMessage?.detail) {
            const match = errorMessage.detail.match(
              /^(.*?): No such file or directory$/
            );
            if (match) {
              throw new Error(`Failed to load ${match[1]}. Check URL entry.`);
            }
            throw new Error(`Server Error: ${errorMessage.detail}`);
          }

          throw new Error(
            `Failed to fetch metadata (Status: ${response.status})`
          );
        }

        const COGdata = (await response.json()) as COGMetadata;

        let mergedMetadata: COGMetadata = { ...COGdata };
        let parsedRenders: RendersType = {};

        if (renders) {
          try {
            // Parse only if `renders` is a string
            parsedRenders =
              typeof renders === 'string'
                ? (JSON.parse(renders) as RendersType)
                : renders;
            mergedMetadata = { ...COGdata, ...parsedRenders };
          } catch (error) {
            logFrontendError('cog.viewer.parse_renders_failed', error);
          }
        }

        setMetadata(mergedMetadata);

        const defaultBands = getDefaultBands(COGdata);
        const initialBands = parsedRenders.bidx?.slice(0, 3) || defaultBands;

        // Default to metadata-derived bands unless renders specifies bidx.
        setSelectedBands(initialBands);
        setRescale(parsedRenders.rescale || [[null, null]]);
        let initialColormapType: ColormapType = 'named';
        let initialCustomColormapJson = '';
        let initialSelectedColormap = 'Internal';

        if (
          parsedRenders.colormap &&
          typeof parsedRenders.colormap === 'object' &&
          !Array.isArray(parsedRenders.colormap) &&
          Object.keys(parsedRenders.colormap).length > 0
        ) {
          initialColormapType = 'custom';
          initialCustomColormapJson = JSON.stringify(
            parsedRenders.colormap,
            null,
            2
          );
        } else if (parsedRenders.colormap_name?.trim()) {
          // Named colormaps come from `colormap_name`.
          // `colormap` is only treated as valid when it is a custom object.
          initialSelectedColormap = parsedRenders.colormap_name;
        }

        dispatchColormap({
          type: 'INIT',
          state: {
            type: initialColormapType,
            selected: initialSelectedColormap,
            customJson: initialCustomColormapJson,
          },
        });
        setColorFormula(parsedRenders.color_formula || null);
        setSelectedResampling(parsedRenders.resampling || null);
        setNoDataValue(parsedRenders.nodata || null);

        fetchTileUrl(
          url,
          initialBands,
          parsedRenders.rescale || [[null, null]],
          initialSelectedColormap,
          parsedRenders.color_formula || null,
          parsedRenders.resampling || null,
          parsedRenders.nodata || null,
          initialColormapType,
          initialColormapType === 'custom'
            ? initialCustomColormapJson
            : undefined
        );

        message.success('COG metadata loaded successfully!');
      } catch (error) {
        logFrontendError('cog.viewer.fetch_metadata_failed', error, {
          endpoint: 'raster/cog/info',
          hasRenders: Boolean(renders),
        });
        if (error instanceof Error) {
          message.error(error.message);
        } else {
          message.error('Failed to load COG metadata.');
        }
      } finally {
        setLoading(false);
      }
    },
    [message, fetchTileUrl]
  );

  return {
    cogUrl,
    setCogUrl,
    metadata,
    fetchMetadata,
    selectedBands,
    setSelectedBands,
    rescale,
    setRescale,
    colormap: { ...colormap, dispatch: dispatchColormap },
    colorFormula,
    setColorFormula,
    selectedResampling,
    setSelectedResampling,
    noDataValue,
    setNoDataValue,
    tileUrl,
    loading,
    isModalVisible,
    setIsModalVisible,
    hasChanges,
    setHasChanges,
    fetchTileUrl,
    mapRef,
    renders,
    setRenders,
  };
};
