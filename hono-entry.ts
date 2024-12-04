import { vikeHandler } from './server/vike-handler';
import { Hono } from 'hono';
import { createHandler } from '@universal-middleware/hono';
import { createIngestHandler } from './server/create-ingest-handler';

const app = new Hono();

app.post('/api/ingest/create', createHandler(createIngestHandler)());

/**
 * Vike route
 *
 * @link {@see https://vike.dev}
 **/
app.all('*', createHandler(vikeHandler)());

export default app;
