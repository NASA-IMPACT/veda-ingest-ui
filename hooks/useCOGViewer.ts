import { useState, useRef, useEffect } from 'react';
import { message } from 'antd';
const baseUrl = 'https://staging.openveda.cloud';

type RendersType = {
  bidx?: number[];
  rescale?: [number, number][];
  colormap_name?: string;
  color_formula?: string;
  resampling?: string;
  nodata?: string;
  assets?: string[];
  title?: string;
};


export const useCOGViewer = () => {
  const [cogUrl, setCogUrl] = useState<string | null>(null);
  const [renders, setRenders] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any | null>(null);
  const [selectedBands, setSelectedBands] = useState<number[]>([]);
  const [rescale, setRescale] = useState<[number | null, number | null][]>([]);
  const [selectedColormap, setSelectedColormap] = useState<string>('Internal');
  const [colorFormula, setColorFormula] = useState<string | null>(null);
  const [selectedResampling, setSelectedResampling] = useState<string | null>(
    null
  );
  const [noDataValue, setNoDataValue] = useState<string | null>(null);
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        if (!mapRef.current) {
          mapRef.current = L.map; // Ensure Leaflet map is only initialized on the client
        }
      });
    }
  }, []);

  const fetchMetadata = async (url: string, renders?: any) => {
    if (!url) {
      message.error('COG URL is required');
      return;
    }
    setLoading(true);
  
    try {
      const response = await fetch(
        `${baseUrl}/api/raster/cog/info?url=${encodeURIComponent(url)}`
      );
      if (!response.ok) throw new Error('Failed to fetch metadata');
      const COGdata = await response.json();
  
      let mergedMetadata = { ...COGdata };
        
      let parsedRenders: RendersType = {};
  
      if (renders) {
        try {
          parsedRenders = JSON.parse(renders) as RendersType; // Explicitly cast to our defined type
          mergedMetadata = { ...COGdata, ...parsedRenders };
        } catch (error) {
          console.error('Error parsing renders:', error);
        }
      }
  
      setMetadata(mergedMetadata);
  
      // Determine the bands from renders or fallback to defaults
      const bandCount = mergedMetadata.band_descriptions?.length || 1;
      const defaultBands = Array.from({ length: bandCount }, (_, i) => i + 1);
      const selectedBands = parsedRenders.bidx || (bandCount === 1 ? [1] : defaultBands.slice(0, 3));
      setSelectedBands(selectedBands);
  
      const defaultRescale: [number | null, number | null][] = defaultBands.map(
        () => [null, null] as [number | null, number | null]
      );
  
      const rescaleValues = parsedRenders.rescale || defaultRescale;
      setRescale(rescaleValues);
  
      // Extract other parameters from renders or set defaults
      const colormap = parsedRenders.colormap_name || 'Internal';
      const colorFormula = parsedRenders.color_formula || null;
      const resampling = parsedRenders.resampling || null;
      const noData = parsedRenders.nodata || null;
  
      // Call fetchTileUrl with merged parameters
      fetchTileUrl(url, selectedBands, rescaleValues, colormap, colorFormula, resampling, noData);
  
      message.success('COG metadata loaded successfully!');
    } catch (error) {
      console.error('Error fetching metadata:', error);
      message.error('Failed to load COG metadata.');
    } finally {
      setLoading(false);
    }
  };
  

  const fetchTileUrl = async (
    url: string,
    bands: number[],
    rescale: [number | null, number | null][],
    colormap: string,
    colorFormula?: string | null,
    resampling?: string | null,
    noData?: string | null
  ) => {
    setLoading(true);
    try {
      if (!url) throw new Error('COG URL is required.');

      const bidxParams = bands.map((band) => `&bidx=${band}`).join('');
      const rescaleParams = rescale
        .filter((range) => range[0] !== null && range[1] !== null)
        .map((range) => `&rescale=${range[0]},${range[1]}`)
        .join('');
      const colormapParam =
        colormap !== 'Internal' ? `&colormap_name=${colormap}` : '';
      const colorFormulaParam = colorFormula
        ? `&color_formula=${encodeURIComponent(colorFormula)}`
        : '';
      const resamplingParam = resampling ? `&resampling=${resampling}` : '';
      const noDataParam = noData ? `&nodata=${encodeURIComponent(noData)}` : '';

      const response = await fetch(
        `${baseUrl}/api/raster/cog/WebMercatorQuad/tilejson.json?url=${encodeURIComponent(
          url
        )}${bidxParams}${rescaleParams}${colormapParam}${colorFormulaParam}${resamplingParam}${noDataParam}`
      );

      if (!response.ok) throw new Error('Failed to fetch tile URL');
      const data = await response.json();
      setTileUrl(data.tiles[0]);

      if (mapRef.current && data.bounds) {
        import('leaflet').then((L) => {
          const bounds = L.latLngBounds([
            [data.bounds[1], data.bounds[0]],
            [data.bounds[3], data.bounds[2]],
          ]);
          mapRef.current.fitBounds(bounds);
        });
      }

      message.success('COG tile layer loaded successfully!');
    } catch (error) {
      console.error('Error fetching tile URL:', error);
      message.error('Failed to load tile layer.');
    } finally {
      setLoading(false);
    }
  };

  return {
    cogUrl,
    setCogUrl,
    metadata,
    fetchMetadata,
    selectedBands,
    setSelectedBands,
    rescale,
    setRescale,
    selectedColormap,
    setSelectedColormap,
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
