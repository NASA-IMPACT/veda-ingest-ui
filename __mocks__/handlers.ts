import fs from 'node:fs';
import path from 'path';
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

  http.post('/api/upload-url', async ({ request }) => {
    return HttpResponse.json({
      uploadUrl:
        'https://s3bucket.s3.us-west-2.amazonaws.com/thumnbnail.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4NPAGWTH4OAKYR4F%2F20250306%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250306T210052Z&X-Amz-Expires=900&X-Amz-Signature=50d8e81e05d3b7ec427b0d9add69c839f5379ce2a27f7f7b6832c1b15fd430c8&X-Amz-SignedHeaders=host',
      fileUrl: 'https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg',
      fileExists: false,
    });
  }),

  http.put(
    'https://s3bucket.s3.us-west-2.amazonaws.com/thumnbnail.jpg',
    async ({}) => {
      return HttpResponse.json({ status: 200 });
    }
  ),
];
