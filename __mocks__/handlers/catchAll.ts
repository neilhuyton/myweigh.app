// __mocks__/handlers/catchAll.ts
import { http, HttpResponse } from 'msw';

export const catchAllHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/:procedure',
  async ({ request, params }) => {
    const procedure = params.procedure as string;
    let body;
    try {
      body = await request.json();
      console.log('Handling catch-all TRPC request:', procedure, body);
    } catch (error) {
      console.error('Error reading catch-all request body:', error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: procedure },
            },
          },
        ],
        { status: 400 }
      );
    }

    const input = (body as { [key: string]: { id?: number } })['0'];
    const id = input?.id ?? 0;

    // Handle invalid batched procedure paths (e.g., resetPassword,resetPassword)
    if (procedure.includes(',')) {
      console.error('Invalid batched procedure path:', procedure);
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: `Invalid procedure path: ${procedure}`,
              code: -32601,
              data: { code: 'NOT_FOUND', httpStatus: 404, path: procedure },
            },
          },
        ],
        { status: 404 }
      );
    }

    console.error('Unhandled procedure:', procedure);
    return HttpResponse.json(
      [
        {
          id,
          error: {
            message: 'Procedure not found',
            code: -32601,
            data: { code: 'NOT_FOUND', httpStatus: 404, path: procedure },
          },
        },
      ],
      { status: 404 }
    );
  }
);