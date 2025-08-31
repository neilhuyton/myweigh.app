// __mocks__/handlers/weightHandlers.ts
import { http, HttpHandler, HttpResponse } from 'msw';

export const weightHandlers: HttpHandler[] = [
  http.post(/http:\/\/localhost:8888\/\.netlify\/functions\/trpc\/weight\.getCurrentGoal/, async ({ request }) => {
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.getCurrentGoal' },
            },
          },
        ],
        { status: 400 }
      );
    }

    const headers = Object.fromEntries(request.headers.entries());
    const userId = headers['authorization']?.split('Bearer ')[1];

    if (!userId) {
      return HttpResponse.json(
        [
          {
            id: body[0]?.id ?? 0,
            error: {
              message: 'Unauthorized: User must be logged in',
              code: -32001,
              data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.getCurrentGoal' },
            },
          },
        ],
        { status: 401 }
      );
    }

    return HttpResponse.json([
      {
        id: body[0]?.id ?? 0,
        result: {
          data: {
            id: 'goal-1',
            goalWeightKg: 65.0,
            goalSetAt: '2025-08-28T12:00:00Z',
            reachedAt: null,
          },
        },
      },
    ]);
  }),
  http.post(/http:\/\/localhost:8888\/\.netlify\/functions\/trpc\/weight\.setGoal/, async ({ request }) => {
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.setGoal' },
            },
          },
        ],
        { status: 400 }
      );
    }

    const query = Array.isArray(body) ? body[0] : body;
    const input = query.input;

    if (!input?.goalWeightKg || input.goalWeightKg <= 0) {
      return HttpResponse.json(
        [
          {
            id: query.id ?? 0,
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
        id: query.id ?? 0,
        result: {
          data: {
            id: 'goal-3',
            goalWeightKg: input.goalWeightKg,
            goalSetAt: new Date().toISOString(),
            reachedAt: null,
          },
        },
      },
    ]);
  }),
  http.post(/http:\/\/localhost:8888\/\.netlify\/functions\/trpc\/weight\.updateGoal/, async ({ request }) => {
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.updateGoal' },
            },
          },
        ],
        { status: 400 }
      );
    }

    const query = Array.isArray(body) ? body[0] : body;
    const input = query.input;

    if (!input?.goalId || !input.goalWeightKg || input.goalWeightKg <= 0) {
      return HttpResponse.json(
        [
          {
            id: query.id ?? 0,
            error: {
              message: 'Goal ID and positive goal weight are required',
              code: -32001,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'weight.updateGoal' },
            },
          },
        ],
        { status: 400 }
      );
    }

    return HttpResponse.json([
      {
        id: query.id ?? 0,
        result: {
          data: {
            id: input.goalId,
            goalWeightKg: input.goalWeightKg,
            goalSetAt: new Date().toISOString(),
            reachedAt: null,
          },
        },
      },
    ]);
  }),
];