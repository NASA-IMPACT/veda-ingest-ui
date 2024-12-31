import { http, HttpResponse } from 'msw';
import { githubResponse } from './githubResponse';
import { retrieveIngestResponse } from './retrieveIngestResponse';

interface EditIngestRequestBody {
  description: string;
}

export const handlers = [
  http.get('/api/list-ingests', async ({ request }) => {
    return HttpResponse.json({ githubResponse });
  }),

  http.get('/api/retrieve-ingest', async ({ request }) => {
    const url = new URL(request.url);
    const githubRef = url.searchParams.get('ref');

    if (!githubRef) {
      return new HttpResponse('Missing github ref in query params', { status: 400 });
    }
    return HttpResponse.json({ ...retrieveIngestResponse });
  }),

  http.put('/api/edit-ingest', async ({ request }) => {
    const body = (await request.json()) as EditIngestRequestBody;

    if (!body.description) {
      return new HttpResponse('Missing description', { status: 400 });
    }

    return HttpResponse.json({ message: 'Edit Successful' });
  }),
];
