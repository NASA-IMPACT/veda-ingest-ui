// TODO: stop using universal-middleware and directly integrate server middlewares instead. (Bati generates boilerplates that use universal-middleware https://github.com/magne4000/universal-middleware to make Bati's internal logic easier. This is temporary and will be removed soon.)
import type { Get, UniversalHandler } from '@universal-middleware/core';
import CreatePR from '../utils/CreatePR';

export const createIngestHandler: Get<[], UniversalHandler<Universal.Context & object>> = () => async (request, _context, _runtime) => {
  const newIngest = await request.json();

  console.log('Received new Ingest', newIngest);
  try {
    const githubResponse = await CreatePR(newIngest);
    console.log('githubResponse: ', githubResponse);

    return new Response(JSON.stringify({ data: githubResponse }), {
      status: 201,
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
  }
};
