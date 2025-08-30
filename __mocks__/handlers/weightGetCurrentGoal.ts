// __mocks__/handlers/weightGetCurrentGoal.ts
import { http, HttpResponse } from 'msw';
import jwt from 'jsonwebtoken';

export const weightGetCurrentGoalHandler = http.post(
  /http:\/\/localhost:8888\/\.netlify\/functions\/trpc\/weight\.getCurrentGoal/,
  async ({ request }) => {
    console.log('MSW: Intercepted weight.getCurrentGoal request:', request.url, request.method);
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Unauthorized',
              code: -32001,
              data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.getCurrentGoal' },
            },
          },
        ],
        { status: 200 }
      );
    }

    const token = authHeader.split(' ')[1];
    let userId: string | null = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      console.error('MSW: Invalid token:', error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid token',
              code: -32001,
              data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.getCurrentGoal' },
            },
          },
        ],
        { status: 200 }
      );
    }

    console.log('MSW: Handling request for userId:', userId);

    if (userId === 'error-user-id') {
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Failed to fetch goal',
              code: -32002,
              data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500, path: 'weight.getCurrentGoal' },
            },
          },
        ],
        { status: 200 }
      );
    }

    if (userId === 'empty-user-id') {
      console.log('MSW: Returning null goal for empty-user-id');
      return HttpResponse.json(
        [{ id: 0, result: { data: null } }],
        { status: 200 }
      );
    }

    // Default case for test-user-id
    const mockGoal = {
      id: 'goal-1',
      goalWeightKg: 65.0,
      goalSetAt: '2025-08-28T12:00:00Z',
      reachedAt: null,
    };
    return HttpResponse.json(
      [{ id: 0, result: { data: mockGoal } }],
      { status: 200 }
    );
  }
);