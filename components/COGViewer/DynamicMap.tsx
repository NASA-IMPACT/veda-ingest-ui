import React, { MutableRefObject } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';

interface DynamicMapProps {
  tileUrl: string | null;
  mapRef: MutableRefObject<LeafletMap | null>;
}

const DynamicMap: React.FC<DynamicMapProps> = ({ tileUrl, mapRef }) => {
  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
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
  );
};

export default DynamicMap;
