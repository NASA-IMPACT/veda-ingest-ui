import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";

interface DynamicMapProps {
  tileUrl: string | null;
  mapRef: React.MutableRefObject<any>;
}

const DynamicMap: React.FC<DynamicMapProps> = ({ tileUrl, mapRef }) => {
  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      style={{ height: "100%", width: "100%" }}
      // @ts-expect-error leaflet something
      whenReady={(map) => {
        mapRef.current = map.target;
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {tileUrl && <TileLayer url={tileUrl} opacity={1.0} attribution="&copy; Your COG Data" />}
    </MapContainer>
  );
};

export default DynamicMap;
