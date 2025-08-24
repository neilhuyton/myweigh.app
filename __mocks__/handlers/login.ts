// __mocks__/handlers/login.ts
import { http, HttpResponse } from 'msw';
import { mockUsers } from '../mockUsers';
import bcrypt from 'bcryptjs';

interface TrpcRequestBody {
  id: number;
  json: { input: { email: string; password: string } };
}

export const loginHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/login',
  async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch {
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

    const { id = 0, json: { input } = {} } = (body as TrpcRequestBody[])[0] || {};

    if (!input?.email || !input?.password) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Email and password are required',
              code: -32603,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'login' },
            },
          },
        ],
        { status: 400 }
      );
    }

    const user = mockUsers.find((u) => u.email === input.email);
    if (!user) {
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

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
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

    return HttpResponse.json([
      {
        id,
        result: {
          data: { id: user.id, email: user.email },
        },
      },
    ]);
  }
);