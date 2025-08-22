// __mocks__/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://localhost:8888/.netlify/functions/trpc/getUsers', () => {
    const response = [
      {
        result: {
          data: [
            {
              id: '27e72eb9-a0ad-4714-bd7a-c148ac1b903e',
              email: 'neil.huyton@gmail.com',
            },
            {
              id: 'fb208768-1bf8-4f8d-bcad-1f94c882ed93',
              email: 'hi@neilhuyton.com',
            },
          ],
        },
      },
    ];
    return HttpResponse.json(response, { status: 200 });
  }),
  http.get('http://localhost:8888/.netlify/functions/trpc/weight.getWeights', ({ request }) => {
    const headers = Object.fromEntries(request.headers.entries());
    const userId = headers['authorization']?.split('Bearer ')[1];
    if (!userId) {
      return HttpResponse.json(
        [
          {
            error: {
              message: 'Unauthorized: User must be logged in',
              code: -32001,
              data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.getWeights' },
            },
          },
        ],
        { status: 401 }
      );
    }
    return HttpResponse.json([
      {
        result: {
          data: [
            {
              id: '1',
              weightKg: 70.5,
              note: 'Morning weigh-in',
              createdAt: '2025-08-20T10:00:00Z',
            },
            {
              id: '2',
              weightKg: 71.0,
              note: 'Evening weigh-in',
              createdAt: '2025-08-19T18:00:00Z',
            },
          ],
        },
      },
    ]);
  }),
  http.get('http://localhost:8888/.netlify/functions/trpc/weight.getGoal', ({ request }) => {
    const headers = Object.fromEntries(request.headers.entries());
    const userId = headers['authorization']?.split('Bearer ')[1];
    if (!userId) {
      return HttpResponse.json(
        [
          {
            error: {
              message: 'Unauthorized: User must be logged in',
              code: -32001,
              data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.getGoal' },
            },
          },
        ],
        { status: 401 }
      );
    }
    return HttpResponse.json([
      {
        result: {
          data: { goalWeightKg: 65.0 },
        },
      },
    ]);
  }),
  http.post('http://localhost:8888/.netlify/functions/trpc/verifyEmail', async ({ request }) => {
    const body = (await request.json()) as {
      [key: string]: { id?: number; token?: string };
    };
    const input = body['0'];
    const id = input?.id ?? 0;
    if (input?.token === 'valid-token') {
      return HttpResponse.json([
        {
          id,
          result: {
            data: { message: 'Email verified successfully' },
          },
        },
      ]);
    }
    return HttpResponse.json(
      [
        {
          id,
          error: {
            message: 'Invalid or expired token',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'verifyEmail' },
          },
        },
      ],
      { status: 401 }
    );
  }),
  http.post('http://localhost:8888/.netlify/functions/trpc/*', async ({ request, params }) => {
    const body = (await request.json()) as {
      [key: string]: { id?: number; email?: string; password?: string; weightKg?: number; note?: string; weightId?: string; goalWeightKg?: number };
    };
    const headers = Object.fromEntries(request.headers.entries());
    const procedure = params[0];
    const input = body['0'];
    const id = input?.id ?? 0;

    if (procedure === 'register') {
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

    if (procedure === 'login') {
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

    if (procedure === 'weight.create') {
      const userId = headers['authorization']?.split('Bearer ')[1];
      if (!userId) {
        return HttpResponse.json(
          [
            {
              id,
              error: {
                message: 'Unauthorized: User must be logged in',
                code: -32001,
                data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.create' },
              },
            },
          ],
          { status: 401 }
        );
      }
      if (!input?.weightKg || input.weightKg <= 0) {
        return HttpResponse.json(
          [
            {
              id,
              error: {
                message: 'Weight must be a positive number',
                code: -32001,
                data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.create' },
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
              id: 'weight-id-123',
              weightKg: input.weightKg,
              createdAt: new Date().toISOString(),
            },
          },
        },
      ]);
    }

    if (procedure === 'weight.delete') {
      const userId = headers['authorization']?.split('Bearer ')[1];
      if (!userId) {
        return HttpResponse.json(
          [
            {
              id,
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
              id,
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
            id,
            result: {
              data: { id: input.weightId },
            },
          },
        ]);
      }
      return HttpResponse.json(
        [
          {
            id,
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

    if (procedure === 'weight.setGoal') {
      const userId = headers['authorization']?.split('Bearer ')[1];
      if (!userId) {
        return HttpResponse.json(
          [
            {
              id,
              error: {
                message: 'Unauthorized: User must be logged in',
                code: -32001,
                data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.setGoal' },
              },
            },
          ],
          { status: 401 }
        );
      }
      if (!input?.goalWeightKg || input.goalWeightKg <= 0) {
        return HttpResponse.json(
          [
            {
              id,
              error: {
                message: 'Goal weight must be a positive number',
                code: -32001,
                data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.setGoal' },
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
            data: { goalWeightKg: input.goalWeightKg },
          },
        },
      ]);
    }

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
  }),
];