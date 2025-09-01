// __mocks__/handlers/weightGetCurrentGoal.ts
import { http, HttpResponse } from 'msw';
import jwt from 'jsonwebtoken';

export const weightGetCurrentGoalHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/weight.getCurrentGoal',
  async ({ request }) => {
    console.log('MSW: Handling weight.getCurrentGoal', {
      url: request.url,
      headers: Object.fromEntries(request.headers),
    });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('MSW: Unauthorized - No Bearer token');
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Unauthorized',
              code: -32001,
              data: {
                code: 'UNAUTHORIZED',
                httpStatus: 401,
                path: 'weight.getCurrentGoal',
              },
            },
          },
        ],
        { status: 200 }
      );
    }

    const token = authHeader.split(' ')[1];
    let userId: string | null = null;
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { userId: string };
      userId = decoded.userId;
      console.log('MSW: Decoded userId:', userId);
    } catch {
      console.log('MSW: Invalid token');
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid token',
              code: -32001,
              data: {
                code: 'UNAUTHORIZED',
                httpStatus: 401,
                path: 'weight.getCurrentGoal',
              },
            },
          },
        ],
        { status: 200 }
      );
    }

    if (userId === 'error-user-id') {
      console.log('MSW: Error userId');
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Failed to fetch weights',
              code: -32002,
              data: {
                code: 'INTERNAL_SERVER_ERROR',
                httpStatus: 500,
                path: 'weight.getCurrentGoal',
              },
            },
          },
        ],
        { status: 200 }
      );
    }

    if (userId === 'empty-user-id') {
      console.log('MSW: Empty userId');
      return HttpResponse.json(
        [{ id: 0, result: { type: 'data', data: null } }],
        { status: 200 }
      );
    }

    console.log('MSW: Returning mock goal for userId:', userId);
    const mockGoal = {
      id: '1',
      goalWeightKg: 65,
      goalSetAt: '2023-10-01T00:00:00Z',
    };
    return HttpResponse.json(
      [{ id: 0, result: { type: 'data', data: mockGoal } }],
      { status: 200 }
    );
  }
);