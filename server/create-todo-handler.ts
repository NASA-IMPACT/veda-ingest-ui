// TODO: stop using universal-middleware and directly integrate server middlewares instead. (Bati generates boilerplates that use universal-middleware https://github.com/magne4000/universal-middleware to make Bati's internal logic easier. This is temporary and will be removed soon.)
import type { Get, UniversalHandler } from '@universal-middleware/core';

export const createTodoHandler: Get<[], UniversalHandler<Universal.Context & object>> = () => async (request, _context, _runtime) => {
  // In a real case, user-provided data should ALWAYS be validated with tools like zod
  const newTodo = (await request.json()) as { text: string };

  console.log('Received new todo', newTodo);

  return new Response(JSON.stringify({ status: 'OK' }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
};
