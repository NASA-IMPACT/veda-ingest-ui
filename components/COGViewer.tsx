import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Input, message, Spin } from "antd";
import COGControlsForm from "@/components/COGControlsForm";
import RenderingOptionsModal from "@/components/RenderingOptionsModal";
import L, { Map } from "leaflet";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });

const baseUrl = 'https://staging.openveda.cloud';

const COGViewer: React.FC = () => {
  const [cogUrl, setCogUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any | null>(null);
  const [selectedBands, setSelectedBands] = useState<number[]>([]); // Initially empty
  const [rescale, setRescale] = useState<[number | null, number | null][]>([]);
  const [selectedColormap, setSelectedColormap] = useState<string>("Internal");
  const [colorFormula, setColorFormula] = useState<string | null>(null);
  const [selectedResampling, setSelectedResampling] = useState<string | null>(null);
  const [noDataValue, setNoDataValue] = useState<string | null>(null);
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const mapRef = useRef<Map | null>(null);

  const fetchMetadata = async (url: string) => {
    if (!url) {
      message.error("COG URL is required");
      return
    }
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/raster/cog/info?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error("Failed to fetch metadata");
      const data = await response.json();
      setMetadata(data);

      // Initialize bands and rescale based on metadata
      const bandCount = data.band_descriptions.length;
      const bands = Array.from({ length: bandCount }, (_, i) => i + 1); // [1, 2, ...]
      setSelectedBands(bandCount === 1 ? [1] : bands.slice(0, 3)); // Single band or first 3 bands for RGB
      setRescale(bands.map(() => [null, null])); // Default rescale to null for each band

      // Fetch initial tile URL
      fetchTileUrl(
        url,
        bandCount === 1 ? [1] : bands.slice(0, 3), // Single band or first 3 bands
        [],
        "Internal"
      );

      message.success("COG metadata loaded successfully!");
    } catch (error) {
      console.error("Error fetching metadata:", error);
      message.error("Failed to load COG metadata. Check the URL.");
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
    noData?: string | null,
  ) => {
    setLoading(true);
    try {
      if (!url) throw new Error("COG URL is required.");

      const bidxParams = bands.length > 1 
        ? bands.map((band) => `&bidx=${band}`).join("") 
        : `&bidx=${bands[0]}`;
      const rescaleParams = rescale
        .filter((range) => range[0] !== null && range[1] !== null)
        .map((range) => `&rescale=${range[0]},${range[1]}`)
        .join("");
      const colormapParam = colormap.toLowerCase() !== "internal" ? `&colormap_name=${colormap.toLowerCase()}` : "";
      const colorFormulaParam = colorFormula ? `&color_formula=${encodeURIComponent(colorFormula)}` : "";
      const resamplingParam = resampling && resampling !== "nearest" ? `&resampling=${resampling}` : "";
      const noDataParam = noData ? `&nodata=${encodeURIComponent(noData)}` : "";

      const response = await fetch(
        `${baseUrl}/api/raster/cog/WebMercatorQuad/tilejson.json?url=${encodeURIComponent(
          url
        )}${bidxParams}${rescaleParams}${colormapParam}${colorFormulaParam}${resamplingParam}${noDataParam}`
      );

      if (!response.ok) throw new Error("Failed to fetch tile URL");
      const data = await response.json();
      setTileUrl(data.tiles[0]);

      // Fit map bounds to the COG
      if (mapRef.current && data.bounds) {
        const bounds = L.latLngBounds([
          [data.bounds[1], data.bounds[0]],
          [data.bounds[3], data.bounds[2]],
        ]);
        mapRef.current.fitBounds(bounds);
      }

      message.success("COG tile layer loaded successfully!");
    } catch (error) {
      console.error("Error fetching tile URL:", error);
      message.error("Failed to load tile layer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* URL Input */}
      <div style={{ padding: "10px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #ddd" }}>
      <Input.Search
  placeholder="Enter COG URL"
  enterButton="Load"
  onSearch={(url) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      message.error("Please enter a valid URL.");
      return;
    }
    setCogUrl(trimmedUrl);
    fetchMetadata(trimmedUrl);
  }}
  loading={loading}
  style={{ maxWidth: "500px", width: "100%" }}
/>

      </div>

      {/* COG Controls */}
      {metadata && (
        <div style={{ padding: "10px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #ddd" }}>
          <COGControlsForm
            metadata={metadata}
            selectedBands={selectedBands}
            rescale={rescale}
            selectedColormap={selectedColormap}
            colorFormula={colorFormula}
            selectedResampling={selectedResampling}
            noDataValue={noDataValue}
            hasChanges={hasChanges}
            onBandChange={(bandIndex, channel) => {
              const updatedBands = [...selectedBands];
              updatedBands[channel === "R" ? 0 : channel === "G" ? 1 : 2] = bandIndex;
              setSelectedBands(updatedBands);
              setHasChanges(true);
            }}
            onRescaleChange={(index, values) => {
              const updatedRescale = [...rescale];
              updatedRescale[index] = values;
              setRescale(updatedRescale);
              setHasChanges(true);
            }}
            onColormapChange={(value) => {
              setSelectedColormap(value);
              setHasChanges(true);
            }}
            onColorFormulaChange={(value) => {
              setColorFormula(value);
              setHasChanges(true);
            }}
            onResamplingChange={(value) => {
              setSelectedResampling(value);
              setHasChanges(true);
            }}
            onNoDataValueChange={(value) => {
              setNoDataValue(value);
              setHasChanges(true);
            }}
            onUpdateTileLayer={() =>
              fetchTileUrl(
                cogUrl!,
                selectedBands,
                rescale,
                selectedColormap,
                colorFormula,
                selectedResampling,
                noDataValue
              )
            }
            onViewRenderingOptions={() => setIsModalVisible(true)}
            loading={loading}
          />
        </div>
      )}

      {/* Map */}
      <div style={{ height: metadata ? "70vh" : "80vh", position: "relative" }}>
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(255, 255, 255, 0.7)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spin size="large" tip="Loading..." />
          </div>
        )}
        <MapContainer
          center={[0, 0]}
          zoom={2}
          style={{ height: "100%", width: "100%" }}
          // @ts-expect-error leaflet something
          whenReady={(map) => {
            mapRef.current = map.target;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {tileUrl && (
            <TileLayer
              url={tileUrl}
              opacity={1.0}
              attribution="&copy; Your COG Data"
            />
          )}
        </MapContainer>
      </div>

      {/* Rendering Options Modal */}
      <RenderingOptionsModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        options={{
          bidx: selectedBands.length > 1 ? selectedBands : [selectedBands[0]],
          rescale,
          colormap_name: selectedColormap.toLowerCase(),
          color_formula: colorFormula || undefined,
          resampling: selectedResampling !== "nearest" ? selectedResampling : undefined,
          nodata: noDataValue || undefined,
        }}
      />
    </div>
  );
};

export default COGViewer;

