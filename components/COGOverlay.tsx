import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import { fromUrl } from "geotiff";
import L from "leaflet";
import { message } from "antd";

interface COGOverlayProps {
  url: string;
  band: number;
  minValue: number;
  maxValue: number;
  noDataValue: number;
  colorMap: { value: number; color: string }[];
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const applyColorMap = (
  value: number,
  colorMap: { value: number; color: string }[]
): [number, number, number] => {
  for (let i = 0; i < colorMap.length - 1; i++) {
    const lower = colorMap[i];
    const upper = colorMap[i + 1];
    if (value >= lower.value && value <= upper.value) {
      const t = (value - lower.value) / (upper.value - lower.value);
      const lowerColor = parseInt(lower.color.slice(1), 16);
      const upperColor = parseInt(upper.color.slice(1), 16);
      const r = Math.round(
        (1 - t) * ((lowerColor >> 16) & 0xff) + t * ((upperColor >> 16) & 0xff)
      );
      const g = Math.round(
        (1 - t) * ((lowerColor >> 8) & 0xff) + t * ((upperColor >> 8) & 0xff)
      );
      const b = Math.round((1 - t) * (lowerColor & 0xff) + t * (upperColor & 0xff));
      return [r, g, b];
    }
  }
  return [0, 0, 0]; // Default to black if no match
};

const COGOverlay: React.FC<COGOverlayProps> = ({
  url,
  band,
  minValue,
  maxValue,
  noDataValue,
  colorMap,
  setLoading,
}) => {
  const map = useMap(); // Get the Leaflet map instance

  useEffect(() => {
    let layer: L.ImageOverlay | null = null;

    const loadCOG = async () => {
      setLoading(true); // Start loading spinner
      try {
        const tiff = await fromUrl(url);
        const image = await tiff.getImage(band - 1);

        const width = image.getWidth();
        const height = image.getHeight();
        const origin = image.getOrigin(); // [longitude, latitude]
        const resolution = image.getResolution(); // [lon/px, lat/px]

        // Calculate bounds
        const bounds: L.LatLngBoundsLiteral = [
          [origin[1], origin[0]], // Top-left (latitude, longitude)
          [
            origin[1] + height * resolution[1], // Bottom-left latitude
            origin[0] + width * resolution[0], // Bottom-right longitude
          ],
        ];

        const raster = await image.readRasters({ interleave: false });
        const data = raster[0];

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to create canvas context");

        const imgData = ctx.createImageData(width, height);
        for (let i = 0; i < data.length; i++) {
          const value = ((data[i] - minValue) / (maxValue - minValue)) * 255;
          const clamped = Math.max(0, Math.min(255, value));
          if (data[i] === noDataValue) {
            imgData.data[i * 4 + 3] = 0; // Fully transparent for noDataValue
          } else {
            const [r, g, b] = applyColorMap(clamped, colorMap);
            imgData.data[i * 4] = r; // Red
            imgData.data[i * 4 + 1] = g; // Green
            imgData.data[i * 4 + 2] = b; // Blue
            imgData.data[i * 4 + 3] = 255; // Fully opaque
          }
        }
        ctx.putImageData(imgData, 0, 0);

        // Add the image overlay to the map
        layer = L.imageOverlay(canvas.toDataURL(), bounds).addTo(map);

        // Zoom the map to fit the bounds
        map.fitBounds(bounds);

        setLoading(false); // Stop loading spinner
        message.success("COG loaded successfully!");
      } catch (error) {
        console.error("Error loading COG:", error);
        setLoading(false); // Stop loading spinner
        message.error(
          error.message.includes("404")
            ? "COG not found (404). Please check the URL."
            : "Failed to load COG. Check the URL or CORS settings."
        );
      }
    };

    if (map) {
      loadCOG();
    }

    return () => {
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [url, band, minValue, maxValue, noDataValue, colorMap, map, setLoading]);

  return null;
};

export default COGOverlay;
