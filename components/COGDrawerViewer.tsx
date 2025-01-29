import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Drawer, Button, message, Spin } from "antd";
import COGControlsForm from "./COGControlsForm";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});

const baseUrl = 'https://staging.openveda.cloud';

interface COGDrawerViewerProps {
  url: string;
  drawerOpen: boolean;
  onClose: () => void;
  onAcceptRenderOptions: (options: object) => void;
  formContext?: any;
}


const COGDrawerViewer: React.FC<COGDrawerViewerProps> = ({
  url,
  drawerOpen,
  onClose,
  onAcceptRenderOptions,
  formContext,
}) => {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [selectedBands, setSelectedBands] = useState<number[]>([1, 1, 1]);
  const [rescale, setRescale] = useState<[number | null, number | null][]>([]);
  const [selectedColormap, setSelectedColormap] = useState("Internal");
  const [colorFormula, setColorFormula] = useState<string | null>(null);
  const [selectedResampling, setSelectedResampling] = useState("nearest");
  const [noDataValue, setNoDataValue] = useState<string | null>(null);

  const mapRef = useRef<any>(null);

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/raster/cog/info?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      setMetadata(data);

      if (data.band_descriptions) {
        setRescale(data.band_descriptions.map(() => [null, null] as [number | null, number | null]));
      }

      await fetchTileUrl(data);
    } catch (error) {
      message.error("Failed to load COG metadata.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTileUrl = async (
    meta: any,
    bands: number[] = selectedBands,
    rescaleValues: [number | null, number | null][] = rescale,
    colormap: string = selectedColormap,
    colorFormulaValue: string | null = colorFormula,
    resampling: string = selectedResampling,
    noData: string | null = noDataValue
  ) => {
    const params = new URLSearchParams();
    params.append("url", url);

    bands.forEach((band) => params.append("bidx", String(band)));
    if (rescaleValues.some((pair) => pair[0] !== null && pair[1] !== null)) {
      params.append(
        "rescale",
        rescaleValues.map((pair) => `[${pair[0] || ""},${pair[1] || ""}]`).join(",")
      );
    }
    if (colormap !== "Internal") params.append("colormap_name", colormap.toLowerCase());
    if (colorFormulaValue) params.append("color_formula", colorFormulaValue);
    if (resampling !== "nearest") params.append("resampling", resampling);
    if (noData) params.append("nodata", noData);

    try {
      const response = await fetch(`${baseUrl}/api/raster/cog/WebMercatorQuad/tilejson.json?${params.toString()}`);
      const data = await response.json();

      setTileUrl(data.tiles[0]);
      if (meta && mapRef.current) {
        const bounds = meta.bounds || data.bounds;
        if (bounds) {
          mapRef.current.fitBounds([
            [bounds[1], bounds[0]],
            [bounds[3], bounds[2]],
          ]);
        }
      }
    } catch (error) {
      message.error("Failed to fetch tile layer.");
      console.error(error);
    }
  };

  const handleAccept = () => {
    if (!formContext || typeof formContext.updateFormData !== "function") {
      console.error("❌ formContext or updateFormData is not available inside COGDrawerViewer.");
      return;
    }
  
    const renderOptions = {
      bidx: selectedBands,
      rescale: rescale.filter((pair) => pair[0] !== null && pair[1] !== null),
      colormap_name: selectedColormap !== "Internal" ? selectedColormap : undefined,
      color_formula: colorFormula || undefined,
      resampling: selectedResampling !== "nearest" ? selectedResampling : undefined,
      nodata: noDataValue || undefined,
    };
  
    formContext.updateFormData((prevData: any) => ({
      ...prevData,
      renders: { ...prevData.renders, renders_object: JSON.stringify(renderOptions, null, 2) }
    }));
  
    onClose();
  };
  

  useEffect(() => {
    if (drawerOpen) {
      fetchMetadata();
    }
  }, [drawerOpen]);
  

  console.log("🔍 formContext in COGDrawerViewer:", formContext);

  return (
    <Drawer
      title="COG Rendering Options"
      placement="right"
      onClose={onClose}
      open={drawerOpen}
      width={800}
    >
      {loading && <Spin tip="Loading COG..." />}
      {metadata && !loading && (
        <COGControlsForm
          metadata={metadata}
          selectedBands={selectedBands}
          rescale={rescale}
          selectedColormap={selectedColormap}
          colorFormula={colorFormula}
          selectedResampling={selectedResampling}
          noDataValue={noDataValue}
          hasChanges={false}
          onBandChange={(bandIndex, channel) => {
            const updatedBands = [...selectedBands];
            updatedBands[channel === "R" ? 0 : channel === "G" ? 1 : 2] = bandIndex;
            setSelectedBands(updatedBands);
          }}
          onRescaleChange={(index, values) => {
            const updatedRescale = [...rescale];
            updatedRescale[index] = values;
            setRescale(updatedRescale);
          }}
          onColormapChange={(value) => {
            setSelectedColormap(value);
          }}
          onColorFormulaChange={(value) => {
            setColorFormula(value);
          }}
          onResamplingChange={(value) => {
            setSelectedResampling(value || "nearest");
          }}
          onNoDataValueChange={(value) => {
            setNoDataValue(value);
          }}
          onUpdateTileLayer={() => fetchTileUrl(metadata)}
          onViewRenderingOptions={() => message.info("View Rendering Options clicked")}
          loading={loading}
        />
      )}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <Button type="primary" onClick={handleAccept} style={{ marginRight: 10 }}>
          Accept Render Options
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </div>
      <div style={{ height: "400px", marginTop: 20 }}>
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
    </Drawer>
  );
};

export default COGDrawerViewer;
