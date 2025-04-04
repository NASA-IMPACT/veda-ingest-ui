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

  http.post('/api/get-signed-url', async ({ request }) => {
    return HttpResponse.json({
      signedUrl:
        'https://bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIARVKJBJKAQFGENG5C%2F20250404%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250404T172309Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEKL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDbCay0UenLbnMIC%2FNEBrzwxs9OxA%2FpiInjFciy4QbeCwIgXp6TynvBQ8%2BUYk4DTvMDM9BZ7rfOmKt9eVCtglRatyAqqQIIGxACGgwxMTQ1MDY2ODA5NjEiDCOsgOx%2BRrGpNQnmWSqGAprgmAbuZhPuNq%2B9syAbMquhq0NKrkxLh0KacxVX3dAX%2FP1gTsCWyQKj1YFTw6owUw0OVMUpFCRjYQDF0GxpwkDqAVYoRzHX%2BLjgtEyvf1BrpDlORgXlN4GwTaohj15%2B8mrtLY3vfW6UEDWDb74rZrv%2FfScK6vofbCd%2BDUg1GtSoGWBpfMVlbYUxOFR5UWnUGyCdNpe7kjJMynMpC%2FlfFlqbI8qdV0LFECOX7S4e52aJVutlcHqVrPwAL7eNYRBk9dYLQH3Mz8nOSHGplOHQuaIZe4YRS0goOrg2WEU8kOXizeVueH9RSB91fwSkeGtHsV8t2fhBsGES4rhaEyFUvgUzD3DHO94w%2FarAvwY6nQG8InOBWfZXbitDPLbnkerLLWfRynjhGZCPaP5VI5D4yRjZcxEaBqvOyRtlLQSG5udSRf7ipKl%2Fgl0AoQPX5wen3A7bHMdpOAzpkn5YIIvYlLIG5SiZDsYopVPtFERiq1mX1xuPmHW58LX%2FPuWsFgKqaSZnTtwsu9cst3PBaHrF9Kdoz%2BoO%2BM%2FFJXvKttr3sJ8Wkexl6bbNRVtSITym&X-Amz-Signature=42e140a71802dcc427a4b76dc217b849066753dfb415d29e29f47a5d36f9008a&X-Amz-SignedHeaders=host',
    });
  }),
];
