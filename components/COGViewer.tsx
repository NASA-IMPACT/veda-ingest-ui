import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Spin, Input, Form, message } from "antd";
import { colormaps } from "@/utils/colormaps";
import COGControls from "./COGControls";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});
const COGOverlay = dynamic(() => import("./COGOverlay"), { ssr: false });

const COGViewer: React.FC = () => {
  const [cogUrl, setCogUrl] = useState<string | null>(null); // COG URL state
  const [selectedColormap, setSelectedColormap] = useState<string>("CFastie"); // Selected colormap
  const [band, setBand] = useState(1); // Selected band
  const [minValue, setMinValue] = useState(0); // Minimum value for rendering
  const [maxValue, setMaxValue] = useState(255); // Maximum value for rendering
  const [noDataValue, setNoDataValue] = useState(-9999); // No data value
  const [loading, setLoading] = useState(false); // Loading state

  // Handle URL submission
  const handleUrlSubmit = (url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      message.error("Please enter a valid URL."); // Show error message for empty URL
      return;
    }
    setCogUrl(trimmedUrl);
    setLoading(true); // Start loading spinner
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* URL Input Section */}
      <div
        style={{
          padding: "10px",
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #ddd",
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Enter COG URL">
            <Input.Search
              placeholder="e.g., /la.tif or https://example.com/cog.tif"
              enterButton="Load"
              onSearch={handleUrlSubmit}
              loading={loading} // Show loading only when fetching URL
              style={{ maxWidth: "500px", width: "100%" }}
            />
          </Form.Item>
        </Form>
      </div>

      {/* Controls Section */}
      <div style={{ padding: "10px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #ddd" }}>
        <COGControls
          selectedColormap={selectedColormap}
          availableColormaps={Object.keys(colormaps)} // Use colormap names
          onColormapChange={(name) => setSelectedColormap(name)}
          onBandChange={(value) => setBand(value)}
          onMinValueChange={(value) => setMinValue(value)}
          onMaxValueChange={(value) => setMaxValue(value)}
          onNoDataValueChange={(value) => setNoDataValue(value)}
        />
      </div>

      {/* Map Section */}
      <div style={{ flex: 1, position: "relative" }}>
        {/* Spinner Overlay */}
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.7)",
            }}
          >
            <Spin size="large" tip="Loading COG..." />
          </div>
        )}

        {/* Map Container */}
        <div style={{ height: "100%", width: "100%" }}>
          <MapContainer center={[34.05, -118.25]} zoom={10} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {cogUrl && (
              <COGOverlay
                url={cogUrl}
                colorMap={colormaps[selectedColormap]} // Pass selected colormap
                band={band} // Pass band
                minValue={minValue} // Pass min value
                maxValue={maxValue} // Pass max value
                noDataValue={noDataValue} // Pass no-data value
                setLoading={setLoading} // Pass loading state setter
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default COGViewer;
