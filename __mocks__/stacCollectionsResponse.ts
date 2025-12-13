export const stacCollectionsResponse = {
  collections: [
    {
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
      ],
      title: 'Test Collection 1',
      assets: {
        thumbnail: {
          href: 'https://thumbnails.openveda.cloud/test-1.png',
          type: 'image/png',
          roles: ['thumbnail'],
          title: 'Thumbnail',
        },
      },
      extent: {
        spatial: {
          bbox: [[-180, -90, 180, 90]],
        },
        temporal: {
          interval: [
            ['2020-01-01T00:00:00+00:00', '2024-12-31T23:59:59+00:00'],
          ],
        },
      },
      license: 'CC0-1.0',
      providers: [
        {
          name: 'NASA VEDA',
          roles: ['host'],
          url: 'https://www.earthdata.nasa.gov/dashboard/',
        },
      ],
      summaries: {
        datetime: ['2020-01-01T00:00:00Z', '2024-12-31T23:59:59Z'],
      },
      description: 'Test collection for unit testing',
      item_assets: {
        cog_default: {
          type: 'image/tiff; application=geotiff; profile=cloud-optimized',
          roles: ['data', 'layer'],
          title: 'Default COG Layer',
          description: 'Cloud optimized default layer to display on map',
        },
      },
      stac_version: '1.0.0',
      stac_extensions: [
        'https://stac-extensions.github.io/render/v1.0.0/schema.json',
        'https://stac-extensions.github.io/item-assets/v1.0.0/schema.json',
      ],
      'dashboard:is_periodic': true,
      'dashboard:time_density': 'month',
    },
    {
      id: 'test-collection-2',
      type: 'Collection',
      links: [
        {
          rel: 'items',
          type: 'application/geo+json',
          href: 'https://test.cloud/api/stac/collections/test-collection-2/items',
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
          href: 'https://test.cloud/api/stac/collections/test-collection-2',
        },
      ],
      title: 'Test Collection 2',
      extent: {
        spatial: {
          bbox: [[-120, 30, -100, 50]],
        },
        temporal: {
          interval: [
            ['2019-01-01T00:00:00+00:00', '2023-12-31T23:59:59+00:00'],
          ],
        },
      },
      license: 'CC0-1.0',
      renders: {
        dashboard: {
          bidx: [1],
          title: 'VEDA Dashboard Render Parameters',
          assets: ['cog_default'],
          rescale: [[0, 100]],
          colormap_name: 'viridis',
        },
      },
      providers: [
        {
          name: 'NASA VEDA',
          roles: ['host'],
          url: 'https://www.earthdata.nasa.gov/dashboard/',
        },
      ],
      summaries: {
        datetime: ['2019-01-01T00:00:00Z', '2023-12-31T23:59:59Z'],
      },
      description: 'Another test collection for unit testing',
      item_assets: {
        cog_default: {
          type: 'image/tiff; application=geotiff; profile=cloud-optimized',
          roles: ['data', 'layer'],
          title: 'Default COG Layer',
          description: 'Cloud optimized default layer to display on map',
        },
      },
      stac_version: '1.0.0',
      stac_extensions: [
        'https://stac-extensions.github.io/render/v1.0.0/schema.json',
        'https://stac-extensions.github.io/item-assets/v1.0.0/schema.json',
      ],
      'dashboard:is_periodic': false,
      'dashboard:time_density': 'day',
    },
    {
      id: 'test-collection-3',
      type: 'Collection',
      links: [
        {
          rel: 'items',
          type: 'application/geo+json',
          href: 'https://test.cloud/api/stac/collections/test-collection-3/items',
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
          href: 'https://test.cloud/api/stac/collections/test-collection-3',
        },
      ],
      title: 'Test Collection 3',
      extent: {
        spatial: {
          bbox: [[88, 20, 93, 27]],
        },
        temporal: {
          interval: [
            ['2018-01-01T00:00:00+00:00', '2022-12-31T23:59:59+00:00'],
          ],
        },
      },
      license: 'CC0-1.0',
      providers: [
        {
          name: 'NASA VEDA',
          roles: ['host'],
          url: 'https://www.earthdata.nasa.gov/dashboard/',
        },
      ],
      summaries: {
        datetime: ['2018-01-01T00:00:00Z', '2022-12-31T23:59:59Z'],
      },
      description: 'Third test collection for unit testing',
      item_assets: {
        cog_default: {
          type: 'image/tiff; application=geotiff; profile=cloud-optimized',
          roles: ['data', 'layer'],
          title: 'Default COG Layer',
          description: 'Cloud optimized default layer to display on map',
        },
      },
      stac_version: '1.0.0',
      stac_extensions: [
        'https://stac-extensions.github.io/item-assets/v1.0.0/schema.json',
      ],
      'dashboard:is_periodic': true,
      'dashboard:time_density': 'year',
    },
  ],
  links: [
    {
      rel: 'next',
      type: 'application/geo+json',
      method: 'GET',
      href: 'https://test.cloud/api/stac/collections?offset=10',
    },
    {
      rel: 'root',
      type: 'application/json',
      href: 'https://test.cloud/api/stac/',
    },
    {
      rel: 'self',
      type: 'application/json',
      href: 'https://test.cloud/api/stac/collections',
    },
  ],
  numberMatched: 3,
  numberReturned: 3,
};
