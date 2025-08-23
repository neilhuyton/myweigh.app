// __mocks__/handlers/register.ts
import { http, HttpResponse } from 'msw';

export const registerHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/register',
  async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error reading register request body:', error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 400 }
      );
    }

    const input = (body as { [key: string]: { id?: number; email?: string; password?: string } })['0'];
    const id = input?.id ?? 0;

    if (!input?.email?.includes('@')) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Invalid email address',
              code: -32001,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 400 }
      );
    }
    if (input?.password && input.password.length < 8) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Password must be at least 8 characters',
              code: -32001,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 400 }
      );
    }
    return HttpResponse.json([
      {
        id,
        result: {
          data: {
            id: 'new-user-id',
            email: input.email,
          },
        },
      },
    ]);
  }
);