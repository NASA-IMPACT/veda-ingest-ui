import { http, HttpResponse } from 'msw';
import { githubResponse } from './githubResponse';
import { retrieveIngestResponse } from './retrieveIngestResponse';

interface EditIngestRequestBody {
  formData: {
    description: string;
  };
}

export const handlers = [
  http.get('/api/list-ingests', async ({ request }) => {
    return HttpResponse.json({ githubResponse });
  }),

  http.get('/api/retrieve-ingest', async ({ request }) => {
    const url = new URL(request.url);
    const githubRef = url.searchParams.get('ref');

    if (!githubRef) {
      return new HttpResponse('Missing github ref in query params', {
        status: 400,
      });
    }
    return HttpResponse.json({ ...retrieveIngestResponse });
  }),

  http.put('/api/create-ingest', async ({ request }) => {
    const body = (await request.json()) as EditIngestRequestBody;

    if (!body.formData.description) {
      return new HttpResponse('Missing description', { status: 400 });
    }

    return HttpResponse.json({ message: 'Data updated successfully' });
  }),

  http.post('/api/create-ingest', async ({ request }) => {
    return HttpResponse.json({
      githubURL: 'https://github.com/nasa-veda/veda-data/pull/12345',
    });
  }),

  http.get('/api/raster/cog/info', ({ request }) => {
    return HttpResponse.json({
      band_descriptions: [
        ['b1', 'Band 1'],
        ['b2', 'Band 2'],
        ['b3', 'Band 3'],
        ['b4', 'Band 4'],
      ],
    });
  }),

  http.get('/api/raster/cog/WebMercatorQuad/tilejson.json', ({ request }) => {
    return HttpResponse.json({
      tilejson: '2.2.0',
      tiles: [
        'https://example.com/api/raster/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png',
      ],
      minzoom: 0,
      maxzoom: 22,
      bounds: [-180, -85.0511, 180, 85.0511],
      center: [0, 0, 2],
    });
  }),

  http.get('/api/raster/colorMaps', ({ request }) => {
    return HttpResponse.json({
      colorMaps: ['accent', 'autumn', 'binary', 'bwr', 'cfastie'],
      links: [
        {
          href: 'https://staging.openveda.cloud/api/raster/colorMaps',
          rel: 'self',
          type: 'application/json',
          title: 'List of available colormaps',
        },
        {
          href: 'https://staging.openveda.cloud/api/raster/colorMaps/{colorMapId}',
          rel: 'data',
          type: 'application/json',
          templated: true,
          title: 'Retrieve colorMap metadata',
        },
        {
          href: 'https://staging.openveda.cloud/api/raster/colorMaps/{colorMapId}?format=png',
          rel: 'data',
          type: 'image/png',
          templated: true,
          title: 'Retrieve colorMap as image',
        },
      ],
    });
  }),
];
