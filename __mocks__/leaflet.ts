// __mocks__/leaflet.ts
import { vi } from 'vitest';

const mockMapInstance = {
  setView: vi.fn().mockReturnThis(),
  addLayer: vi.fn().mockReturnThis(),
  remove: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(), // Mock event handling
  off: vi.fn().mockReturnThis(),
  fitBounds: vi.fn().mockReturnThis(),
  getBounds: vi.fn().mockReturnValue({
    // Mock a LatLngBounds object if your code uses it
    getSouthWest: vi.fn().mockReturnValue({ lat: 0, lng: 0 }),
    getNorthEast: vi.fn().mockReturnValue({ lat: 0, lng: 0 }),
  }),
};

const mockTileLayerInstance = {
  addTo: vi.fn().mockReturnThis(),
  // Add other TileLayer methods if needed
};

const mockMarkerInstance = {
  addTo: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),
  openPopup: vi.fn().mockReturnThis(),
  setLatLng: vi.fn().mockReturnThis(),
  // Add other Marker methods if needed
};

const mockIconInstance = {
  // Mock properties or methods of an Icon instance if accessed
};

// Mock the main 'L' object and its factory functions
const L = {
  map: vi.fn((_id: string | HTMLElement, _options?: any) => mockMapInstance),
  tileLayer: vi.fn(
    (_urlTemplate?: string, _options?: any) => mockTileLayerInstance
  ),
  marker: vi.fn((_latlng?: any, _options?: any) => mockMarkerInstance),
  icon: vi.fn((_options?: any) => mockIconInstance),
  Icon: {
    // If you use new L.Icon.Default() or similar
    Default: vi.fn().mockImplementation(() => mockIconInstance),
  },
};

export const { map, tileLayer, marker, icon, Icon } = L;
export default L;
