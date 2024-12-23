import { http, HttpResponse } from 'msw'
import { githubResponse } from './githubResponse';
import { retrieveIngestResponse } from './retrieveIngestResponse';
 
export const handlers = [
http.get('/api/list-ingests', async ({ request }) => {
  return HttpResponse.json({githubResponse})
}),

http.get('/api/retrieve-ingest', async ({ request }) => {

  const url = new URL(request.url)
 
  const githubRef = url.searchParams.get('ref')

  if (!githubRef) {
    return new HttpResponse('Missing github ref in query params', { status: 400 })
  }
  return HttpResponse.json({...retrieveIngestResponse})
}),
]