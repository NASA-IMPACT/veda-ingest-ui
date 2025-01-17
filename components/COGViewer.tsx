import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Input, message, Spin } from "antd";
import COGControlsForm from "./COGControlsForm";
import RenderingOptionsModal from "./RenderingOptionsModal";
import L, { Map } from "leaflet";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const baseUrl = 'https://staging.openveda.cloud';

const COGViewer: React.FC = () => {
  const [cogUrl, setCogUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [selectedBand, setSelectedBand] = useState<number>(1);
  const [rescaleMin, setRescaleMin] = useState<number | null>(null);
  const [rescaleMax, setRescaleMax] = useState<number | null>(null);
  const [selectedColormap, setSelectedColormap] = useState<string>("Internal");
  const [colorFormula, setColorFormula] = useState<string>("");
  const [selectedResampling, setSelectedResampling] = useState<string>("nearest");
  const [noDataValue, setNoDataValue] = useState<string>("");
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const mapRef = useRef<Map | null>(null);

  const fetchMetadata = async (url: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/raster/cog/info?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error("Failed to fetch metadata");
      const data = await response.json();
      setMetadata(data);
      setSelectedBand(1);
      message.success("COG metadata loaded successfully!");

      // Request only the first 3 bands for the initial tile load
      const bands = data.band_descriptions.slice(0, 3).map((_: any, index: number) => index + 1);
      fetchTileUrl(url, bands, null, null, selectedColormap, colorFormula, selectedResampling, noDataValue);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      message.error("Failed to load COG metadata. Check the URL.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTileUrl = async (
    url: string,
    bands: number | number[],
    rescaleMin: number | null,
    rescaleMax: number | null,
    colormap: string,
    colorFormula?: string,
    resampling?: string,
    noData?: string
  ) => {
    setLoading(true);
    try {
      if (!url) throw new Error("COG URL is required.");

      const colormapName = colormap?.toLowerCase() || "internal";
      const colormapParam = colormapName !== "internal" ? `&colormap_name=${colormapName}` : "";
      const colorFormulaParam = colorFormula ? `&color_formula=${encodeURIComponent(colorFormula)}` : "";
      const resamplingParam = resampling && resampling !== "nearest" ? `&resampling=${resampling}` : "";
      const noDataParam = noData ? `&nodata=${encodeURIComponent(noData)}` : "";
      const rescaleParam =
        rescaleMin !== null && rescaleMax !== null ? `&rescale=${rescaleMin},${rescaleMax}` : "";

      const bidxParams = Array.isArray(bands)
        ? bands.map((band) => `&bidx=${band}`).join("")
        : `&bidx=${bands}`;

      const response = await fetch(
        `${baseUrl}/api/raster/cog/WebMercatorQuad/tilejson.json?url=${encodeURIComponent(
          url
        )}${bidxParams}${colormapParam}${colorFormulaParam}${resamplingParam}${noDataParam}${rescaleParam}`
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "10px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #ddd" }}>
        <Input.Search
          placeholder="Enter COG URL"
          enterButton="Load"
          onSearch={(url) => {
            setCogUrl(url.trim());
            fetchMetadata(url.trim());
          }}
          loading={loading}
          style={{ maxWidth: "500px", width: "100%" }}
        />
      </div>

      <div style={{ flex: 1, position: "relative" }}>
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
        {metadata && (
    <div style={{ padding: "10px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #ddd" }}>
      <COGControlsForm
        metadata={metadata}
        selectedBand={selectedBand}
        rescaleMin={rescaleMin}
        rescaleMax={rescaleMax}
        selectedColormap={selectedColormap}
        colorFormula={colorFormula}
        selectedResampling={selectedResampling}
        noDataValue={noDataValue}
        hasChanges={hasChanges}
        onBandChange={setSelectedBand}
        onRescaleMinChange={setRescaleMin}
        onRescaleMaxChange={setRescaleMax}
        onColormapChange={setSelectedColormap}
        onColorFormulaChange={setColorFormula}
        onResamplingChange={setSelectedResampling}
        onNoDataValueChange={setNoDataValue}
        onUpdateTileLayer={() =>
          fetchTileUrl(
            cogUrl!,
            selectedBand,
            rescaleMin,
            rescaleMax,
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

        <MapContainer
          center={[0, 0]}
          zoom={2}
          style={{ height: "100%", width: "100%" }}
          // @ts-expect-error leaflet
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
    </div>
  );
};

export default COGViewer;
