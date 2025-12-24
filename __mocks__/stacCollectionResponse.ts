export const stacCollectionResponse = {
  id: 'test-collection-1',
  type: 'Collection',
  links: [
    {
      rel: 'items',
      type: 'application/geo+json',
      href: 'https://test.cloud/api/stac/collections/test-collection-1/items',
    },
    {
      rel: 'parent',
      type: 'application/json',
      href: 'https://test.cloud/api/stac/',
    },
    {
      rel: 'root',
      type: 'application/json',
      href: 'https://test.cloud/api/stac/',
    },
    {
      rel: 'self',
      type: 'application/json',
      href: 'https://test.cloud/api/stac/collections/test-collection-1',
    },
    {
      rel: 'http://www.opengis.net/def/rel/ogc/1.0/queryables',
      type: 'application/schema+json',
      title: 'Queryables',
      href: 'https://test.cloud/api/stac/collections/test-collection-1/queryables',
    },
  ],
  title: 'Test Collection 1 Full Details',
  assets: null,
  extent: {
    spatial: {
      bbox: [[-96.71, 29.07, -94.41, 30.87]],
    },
    temporal: {
      interval: [['2000-01-01T00:00:00+00:00', '2019-01-01T00:00:00+00:00']],
    },
  },
  license: 'CC0-1.0',
  keywords: null,
  providers: [
    {
      name: 'NASA VEDA',
      roles: ['host'],
      url: 'https://www.earthdata.nasa.gov/dashboard/',
    },
  ],
  summaries: {
    datetime: ['2000-01-01T00:00:00Z', '2019-01-01T00:00:00Z'],
  },
  description: 'Test collection for unit testing with full details',
  item_assets: {
    cog_default: {
      type: 'image/tiff; application=geotiff; profile=cloud-optimized',
      roles: ['data', 'layer'],
      title: 'Default COG Layer',
      description: 'Cloud optimized default layer to display on map',
    },
  },
  stac_version: '1.0.0',
  stac_extensions: null,
  'dashboard:is_periodic': true,
  'dashboard:time_density': 'month',
};
