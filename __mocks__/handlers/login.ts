// __mocks__/handlers/login.ts
import { http, HttpResponse } from 'msw';

export const loginHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/login',
  async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error reading login request body:', error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'login' },
            },
          },
        ],
        { status: 400 }
      );
    }

    const input = (body as { [key: string]: { id?: number; email?: string; password?: string } })['0'];
    const id = input?.id ?? 0;

    if (input?.email === 'testuser@example.com' && input?.password === 'password123') {
      return HttpResponse.json([
        {
          id,
          result: {
            data: {
              id: 'test-user-id',
              email: input.email,
            },
          },
        },
      ]);
    }
    return HttpResponse.json(
      [
        {
          id,
          error: {
            message: 'Invalid email or password',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'login' },
          },
        },
      ],
      { status: 401 }
    );
  }
);