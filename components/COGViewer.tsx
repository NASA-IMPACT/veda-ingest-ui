import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Input, message, Spin } from "antd";
import COGControlsForm from "./COGControlsForm";
import RenderingOptionsModal from "./RenderingOptionsModal";
import L, { Map } from "leaflet";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });

const baseUrl = 'https://openveda.cloud';

const COGViewer: React.FC = () => {
  const [cogUrl, setCogUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [selectedBand, setSelectedBand] = useState<number>(1);
  const [rescaleMin, setRescaleMin] = useState<number>(-3.4028235e38);
  const [rescaleMax, setRescaleMax] = useState<number>(3.4028235e38);
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
      fetchTileUrl(
        url,
        1, // Default to the first band
        rescaleMin,
        rescaleMax,
        selectedColormap,
        colorFormula,
        selectedResampling,
        noDataValue
      );
    } catch (error) {
      console.error("Error fetching metadata:", error);
      message.error("Failed to load COG metadata. Check the URL.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTileUrl = async (
    url: string,
    band: number,
    rescaleMin: number,
    rescaleMax: number,
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

      const response = await fetch(
        `${baseUrl}/api/raster/cog/WebMercatorQuad/tilejson.json?url=${encodeURIComponent(
          url
        )}&bidx=${band}&rescale=${rescaleMin},${rescaleMax}${colormapParam}${colorFormulaParam}${resamplingParam}${noDataParam}`
      );

      if (!response.ok) throw new Error("Failed to fetch tile URL");
      const data = await response.json();
      setTileUrl(data.tiles[0]);

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
            onBandChange={(value) => {
              setSelectedBand(value);
              setHasChanges(true);
            }}
            onRescaleMinChange={(value) => {
              setRescaleMin(value);
              setHasChanges(true);
            }}
            onRescaleMaxChange={(value) => {
              setRescaleMax(value);
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
            onUpdateTileLayer={() => {
              if (cogUrl) {
                fetchTileUrl(
                  cogUrl,
                  selectedBand,
                  rescaleMin,
                  rescaleMax,
                  selectedColormap,
                  colorFormula,
                  selectedResampling,
                  noDataValue
                );
              }
            }}
            onViewRenderingOptions={() => setIsModalVisible(true)}
            loading={loading}
          />
        </div>
      )}

      <RenderingOptionsModal
        visible={isModalVisible}
        options={{
          bidx: [selectedBand],
          colormap_name: selectedColormap.toLowerCase(),
          ...(selectedResampling !== "nearest" && { resampling: selectedResampling }),
          ...(colorFormula && { color_formula: colorFormula }),
          ...(noDataValue && { nodata: noDataValue }),
        }}
        onClose={() => setIsModalVisible(false)}
      />

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
        <MapContainer
          center={[0, 0]}
          zoom={2}
          style={{ height: "100%", width: "100%" }}
          //@ts-expect-error leaflet something
          whenReady={(map) => {
            mapRef.current = map.target;
          }}
        >
          <TileLayer
            url={tileUrl || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
            attribution="&copy; OpenStreetMap contributors"
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default COGViewer;
