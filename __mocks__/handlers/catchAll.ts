// __mocks__/handlers/catchAll.ts
import { http, HttpResponse } from 'msw';

export const catchAllHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/:procedure',
  async ({ request, params }) => {
    const clonedRequest = request.clone(); // Clone request
    const procedure = params.procedure as string;
    let body;
    try {
      body = await clonedRequest.json();
    } catch {
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

    const query = (body as { [key: string]: { path: string } })['0'];
    const path = query?.path || procedure;
    const id = (body as { [key: string]: { id?: number } })['0']?.id ?? 0;

    // Handle invalid batched procedure paths
    if (procedure.includes(',')) {
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

    return HttpResponse.json(
      [
        {
          id,
          error: {
            message: 'Procedure not found',
            code: -32601,
            data: { code: 'NOT_FOUND', httpStatus: 404, path },
          },
        },
      ],
      { status: 404 }
    );
  }
);