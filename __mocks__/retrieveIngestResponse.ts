export const retrieveIngestResponse = {
  fileSha: '9d114cce587767ae8363d362b8a8eb4221c36617',
  filePath: 'ingestion-data/staging/dataset-config/seededingest1.json',
  content: {
    links: [],
    spatial_extent: {
      xmin: 1,
      ymin: 1,
      xmax: 1,
      ymax: 1,
    },
    temporal_extent: {
      startdate: '2024-02-01T07:00:00.000Z',
      enddate: '2025-01-31T07:00:00.000Z',
    },
    discovery_items: [
      {
        upload: true,
        cogify: false,
        dry_run: false,
        filename_regex: '[\\s\\S]*',
        use_multithreading: true,
        prefix: 'test',
        bucket: 'test',
      },
    ],
    sample_files: ['test'],
    data_type: 'cog',
    stac_extensions: [],
    item_assets: {
      cog_default: {
        type: 'image/tiff; application=geotiff; profile=cloud-optimized',
        roles: ['data', 'layer'],
        title: 'Default COG Layer',
        description: 'Cloud optimized default layer to display on map',
      },
    },
    providers: [
      {
        roles: [],
        name: 'test',
      },
    ],
    assets: {
      thumbnail: {
        roles: ['test'],
        title: 'pic',
        description: 'pretty',
        href: 'http://www.test.com',
        type: 'test',
      },
    },
    collection: 'seeded-ingest-1',
    title: 'test',
    license: 'test',
    description: 'seeded ingest description #1',
    renders: {
      dashboard: {
        json: true,
      },
    },
  },
};
