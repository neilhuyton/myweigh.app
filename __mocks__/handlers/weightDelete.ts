// __mocks__/handlers/weightDelete.ts
import { http, HttpResponse } from 'msw';

export const weightDeleteHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/weight.delete',
  async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error reading weight.delete request body:', error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.delete' },
            },
          },
        ],
        { status: 400 }
      );
    }

    const headers = Object.fromEntries(request.headers.entries());
    const input = (body as { [key: string]: { weightId?: string } })['0'];
    const userId = headers['authorization']?.split('Bearer ')[1];

    if (!userId) {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Unauthorized: User must be logged in',
              code: -32001,
              data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.delete' },
            },
          },
        ],
        { status: 401 }
      );
    }
    if (!input?.weightId) {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid weight ID',
              code: -32001,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.delete' },
            },
          },
        ],
        { status: 400 }
      );
    }
    if (input.weightId === '1') {
      return HttpResponse.json([
        {
          id: 0,
          result: {
            data: { id: input.weightId },
          },
        },
      ]);
    }
    return HttpResponse.json(
      [
        {
          id: 0,
          error: {
            message: 'Weight measurement not found',
            code: -32001,
            data: { code: 'NOT_FOUND', httpStatus: 404, path: 'weight.delete' },
          },
        },
      ],
      { status: 404 }
    );
  }
);