export const collectionIngestResponse = {
  type: 'Collection',
  id: 'Playwright_TEST',
  stac_version: '1.0.0',
  description:
    "\nThis collection represents advanced satellite-based observations, providing comprehensive data for Earth monitoring. Orbiting our planet, these satellites are equipped with state-of-the-art sensors designed to capture high-resolution imagery and measurements. The data stream facilitates a wide range of applications, from tracking environmental changes and monitoring climate patterns to supporting disaster response and management efforts. With global coverage and consistent revisit times, this dataset is a crucial resource for scientists, researchers, and policy-makers, enabling new insights into our planet's complex systems.",
  keywords: [],
  license: 'CC0-1.0',
  extent: {
    spatial: {
      bbox: [[-180, -90, 180, 90]],
    },
    temporal: {
      interval: [['1998-01-01T00:00:00+00:00', null]],
    },
  },
  links: [
    {
      href: 'https://website.cloud/api/stac/collections/ABC_123EFGHF/items',
      rel: 'items',
      type: 'application/geo+json',
    },
    {
      href: 'https://website.cloud/api/stac/',
      rel: 'parent',
      type: 'application/json',
    },
    {
      href: 'https://website.cloud/api/stac/',
      rel: 'root',
      type: 'application/json',
    },
    {
      href: 'https://website.cloud/api/stac/collections/ABC_123EFGHF',
      rel: 'self',
      type: 'application/json',
    },
    {
      href: 'https://website.cloud/api/stac/collections/ABC_123EFGHF/queryables',
      rel: 'http://www.opengis.net/def/rel/ogc/1.0/queryables',
      type: 'application/schema+json',
      title: 'Queryables',
    },
  ],
  providers: [
    {
      name: 'NASA/GSFC/SED/ESD/TISL/GESDISC',
      description:
        'Goddard Earth Sciences Data and Information Services Center (formerly Goddard DAAC), Terrestrial Information Systems Laboratory, Earth Sciences Division, Science and Exploration Directorate, Goddard Space Flight Center, NASA',
      roles: [],
      url: 'https://disc.gsfc.nasa.gov/',
    },
  ],
  renders: {
    randomError: {
      title: 'Renders configuration for randomError',
      backend: 'xarray',
      rescale: [[0, 17469]],
      resampling: 'average',
      colormap_name: 'reds',
    },
    precipitation: {
      title: 'Renders configuration for precipitation',
      backend: 'xarray',
      rescale: [[0, 48]],
      resampling: 'average',
      colormap_name: 'cfastie',
    },
    MWprecipitation: {
      title: 'Renders configuration for MWprecipitation',
      backend: 'xarray',
      rescale: [[0, 50]],
      resampling: 'average',
      colormap_name: 'cfastie',
    },
  },
  item_assets: {},
  'cube:variables': {
    time_bnds: {
      type: 'data',
      attrs: {},
      shape: [null, 2],
      chunks: [1, 2],
      dimensions: ['time', 'nv'],
    },
    randomError: {
      type: 'data',
      unit: 'mm/day',
      attrs: {
        units: 'mm/day',
        long_name:
          'Root-mean-square error estimate for combined microwave-IR daily precipitation rate',
      },
      shape: [null, 3600, 1800],
      chunks: [1, 3600, 900],
      renders: 'randomError',
      dimensions: ['time', 'lon', 'lat'],
      description:
        'Root-mean-square error estimate for combined microwave-IR daily precipitation rate',
    },
    precipitation: {
      type: 'data',
      unit: 'mm/day',
      attrs: {
        units: 'mm/day',
        long_name:
          'Daily mean precipitation rate (combined microwave-IR) estimate. Formerly precipitationCal.',
      },
      shape: [null, 3600, 1800],
      chunks: [1, 3600, 900],
      renders: 'precipitation',
      dimensions: ['time', 'lon', 'lat'],
      description:
        'Daily mean precipitation rate (combined microwave-IR) estimate. Formerly precipitationCal.',
    },
    MWprecipitation: {
      type: 'data',
      unit: 'mm/day',
      attrs: {
        units: 'mm/day',
        long_name:
          'Daily mean High Quality precipitation rate from all available microwave sources. Formerly HQprecipitation.',
      },
      shape: [null, 3600, 1800],
      chunks: [1, 3600, 900],
      renders: 'MWprecipitation',
      dimensions: ['time', 'lon', 'lat'],
      description:
        'Daily mean High Quality precipitation rate from all available microwave sources. Formerly HQprecipitation.',
    },
    randomError_cnt: {
      type: 'data',
      unit: 'count',
      attrs: {
        units: 'count',
        long_name:
          'Count of valid half-hourly randomError retrievals for the day',
      },
      shape: [null, 3600, 1800],
      chunks: [1, 3600, 900],
      dimensions: ['time', 'lon', 'lat'],
      description:
        'Count of valid half-hourly randomError retrievals for the day',
    },
    precipitation_cnt: {
      type: 'data',
      unit: 'count',
      attrs: {
        units: 'count',
        long_name:
          'Count of all valid half-hourly precipitation retrievals for the day',
      },
      shape: [null, 3600, 1800],
      chunks: [1, 3600, 900],
      dimensions: ['time', 'lon', 'lat'],
      description:
        'Count of all valid half-hourly precipitation retrievals for the day',
    },
    MWprecipitation_cnt: {
      type: 'data',
      unit: 'count',
      attrs: {
        units: 'count',
        long_name:
          'Count of all valid half-hourly MWprecipitation retrievals for the day',
      },
      shape: [null, 3600, 1800],
      chunks: [1, 3600, 900],
      dimensions: ['time', 'lon', 'lat'],
      description:
        'Count of all valid half-hourly MWprecipitation retrievals for the day',
    },
    precipitation_cnt_cond: {
      type: 'data',
      unit: 'count',
      attrs: {
        units: 'count',
        long_name:
          'Count of half-hourly precipitation retrievals for the day where precipitation is at least 0.01 mm/hr',
      },
      shape: [null, 3600, 1800],
      chunks: [1, 3600, 900],
      dimensions: ['time', 'lon', 'lat'],
      description:
        'Count of half-hourly precipitation retrievals for the day where precipitation is at least 0.01 mm/hr',
    },
    MWprecipitation_cnt_cond: {
      type: 'data',
      unit: 'count',
      attrs: {
        units: 'count',
        long_name:
          'Count of half-hourly MWprecipitation retrievals for the day where precipitation is at least 0.01 mm/hr',
      },
      shape: [null, 3600, 1800],
      chunks: [1, 3600, 900],
      dimensions: ['time', 'lon', 'lat'],
      description:
        'Count of half-hourly MWprecipitation retrievals for the day where precipitation is at least 0.01 mm/hr',
    },
    probabilityLiquidPrecipitation: {
      type: 'data',
      unit: 'percent',
      attrs: {
        units: 'percent',
        long_name: 'Probability of liquid precipitation',
        description:
          'Probability of liquid precipitation estimated with a diagnostic parameterization using ancillary data. 0=missing values; 1=likely solid; 100=likely liquid or no precipitation.  Screen by positive precipitation or precipitation_cnt_cond to locate meaningful probabilities.',
      },
      shape: [null, 3600, 1800],
      chunks: [1, 3600, 900],
      dimensions: ['time', 'lon', 'lat'],
      description:
        'Probability of liquid precipitation estimated with a diagnostic parameterization using ancillary data. 0=missing values; 1=likely solid; 100=likely liquid or no precipitation.  Screen by positive precipitation or precipitation_cnt_cond to locate meaningful probabilities.',
    },
  },
  'cube:dimensions': {
    lat: {
      axis: 'y',
      type: 'spatial',
      extent: [-89.95, 89.95],
      description: 'Latitude',
      reference_system: 4326,
    },
    lon: {
      axis: 'x',
      type: 'spatial',
      extent: [-179.949996948242, 179.949996948242],
      description: 'Longitude',
      reference_system: 4326,
    },
    time: {
      step: 'P1D',
      type: 'temporal',
      extent: ['1998-01-01T00:00:00Z', null],
      description: 'time',
    },
  },
  stac_extensions: [
    'https://stac-extensions.github.io/datacube/v2.2.0/schema.json',
  ],
  collection_concept_id: 'C2723754864-GES_DISC',
  'dashboard:is_periodic': true,
  'dashboard:time_density': 'day',
  summaries: {},
};
