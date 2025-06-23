import { http, HttpResponse } from 'msw';

import { githubResponse } from './githubResponse';
import { retrieveIngestResponse } from './retrieveIngestResponse';
import { collectionIngestResponse } from './collectionIngestResponse';
// --- Placeholder Tile Logic ---
const MOCK_TILE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
function base64ToArrayBuffer(base64DataUri: string) {
  if (!base64DataUri || !base64DataUri.includes(',')) {
    console.error('Invalid Base64 Data URI provided for tile mock');
    return new ArrayBuffer(0);
  }
  const base64 = base64DataUri.split(',')[1];
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error('Error decoding Base64 string for tile mock:', e);
    return new ArrayBuffer(0);
  }
}
const mockTileBuffer = base64ToArrayBuffer(MOCK_TILE_BASE64);

const mockSession = {
  user: {
    name: 'Mock User',
    email: 'test.user@example.com',
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

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
    const ref = url.searchParams.get('ref');
    const ingestionType = url.searchParams.get('ingestionType');

    if (!ref) {
      return HttpResponse.json(
        { error: 'Missing required query parameter: "ref".' },
        { status: 400 }
      );
    }

    if (!ingestionType || !['dataset', 'collection'].includes(ingestionType)) {
      return HttpResponse.json(
        {
          error:
            'Missing or invalid "ingestionType". Must be "dataset" or "collection".',
        },
        { status: 400 }
      );
    }

    if (ingestionType === 'collection') {
      return HttpResponse.json({
        filePath: 'ingestion-data/staging/collections/NEW_TEST.json',
        fileSha: '123456789abcdefg',
        content: collectionIngestResponse,
      });
    }

    // Default to returning the dataset response
    return HttpResponse.json({
      filePath: 'ingestion-data/staging/dataset-config/NEW_TEST.json',
      fileSha: '123456789abcdefg',
      content: retrieveIngestResponse,
    });
  }),

  http.put('/api/create-dataset', async ({ request }) => {
    const body = (await request.json()) as EditIngestRequestBody;

    if (!body.formData.description) {
      return new HttpResponse('Missing description', { status: 400 });
    }

    return HttpResponse.json({ message: 'Data updated successfully' });
  }),

  http.post('/api/create-dataset', async ({ request }) => {
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
        'https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4NPAGWTH4OAKYR4F%2F20250306%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250306T210052Z&X-Amz-Expires=900&X-Amz-Signature=50d8e81e05d3b7ec427b0d9add69c839f5379ce2a27f7f7b6832c1b15fd430c8&X-Amz-SignedHeaders=host',
      fileUrl: 'https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg',
      fileExists: false,
    });
  }),

  http.put(
    'https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg',
    async ({}) => {
      return new HttpResponse(null, { status: 200 });
    }
  ),

  http.get('/api/auth/session', ({ request }) => {
    return HttpResponse.json(mockSession);
  }),

  http.get(
    'https://example.com/api/raster/cog/tiles/WebMercatorQuad/:z/:x/:y.png',
    ({ request, params }) => {
      if (!mockTileBuffer || mockTileBuffer.byteLength === 0) {
        console.error('[MSW] Mock tile buffer is invalid for example.com!');
        return new HttpResponse('Error generating mock tile', { status: 500 });
      }
      return new HttpResponse(mockTileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': mockTileBuffer.byteLength.toString(),
          'X-MSW-Mocked': 'true',
        },
      });
    }
  ),

  http.get('https://*.tile.openstreetmap.org/:z/:x/:y.png', ({ request }) => {
    if (!mockTileBuffer || mockTileBuffer.byteLength === 0) {
      console.error('[MSW] Mock tile buffer is invalid for OSM!');
      return new HttpResponse('Error generating mock tile', { status: 500 });
    }

    return new HttpResponse(mockTileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': mockTileBuffer.byteLength.toString(),
        'X-MSW-Mocked': 'true',
      },
    });
  }),
];
