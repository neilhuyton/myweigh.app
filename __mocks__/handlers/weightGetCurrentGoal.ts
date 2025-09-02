import { http, HttpResponse } from 'msw';

export const weightGetCurrentGoalHandler = http.get(
  'http://localhost:8888/.netlify/functions/trpc/weight.getCurrentGoal',
  async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: 'Unauthorized',
            code: -32001,
            data: {
              code: 'UNAUTHORIZED',
              httpStatus: 401,
              path: params.path ?? 'weight.getCurrentGoal',
            },
          },
        },
        { status: 200 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let userId: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
    } catch {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: 'Invalid token',
            code: -32001,
            data: {
              code: 'UNAUTHORIZED',
              httpStatus: 401,
              path: params.path ?? 'weight.getCurrentGoal',
            },
          },
        },
        { status: 200 }
      );
    }

    if (userId === 'test-user-id') {
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: 'data',
            data: {
              id: '1',
              goalWeightKg: 65.0,
              goalSetAt: '2025-08-28T00:00:00Z',
              reachedAt: null,
            },
          },
        },
        { status: 200 }
      );
    }

    if (userId === 'empty-user-id') {
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: 'data',
            data: null,
          },
        },
        { status: 200 }
      );
    }

    if (userId === 'error-user-id') {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: 'Failed to fetch current goal',
            code: -32002,
            data: {
              code: 'INTERNAL_SERVER_ERROR',
              httpStatus: 500,
              path: params.path?.includes('weight.getCurrentGoal') ? 'weight.getCurrentGoal' : 'unknown',
            },
          },
        },
        { status: 200 }
      );
    }

    if (userId === 'invalid-user-id') {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: 'Invalid token',
            code: -32001,
            data: {
              code: 'UNAUTHORIZED',
              httpStatus: 401,
              path: params.path ?? 'weight.getCurrentGoal',
            },
          },
        },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      {
        id: 0,
        error: {
          message: 'Unauthorized',
          code: -32001,
          data: {
            code: 'UNAUTHORIZED',
            httpStatus: 401,
            path: params.path ?? 'weight.getCurrentGoal',
          },
        },
      },
      { status: 200 }
    );
  }
);