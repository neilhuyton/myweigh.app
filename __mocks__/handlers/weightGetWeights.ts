import { http, HttpResponse } from 'msw';
import jwt from 'jsonwebtoken';

export const weightGetWeightsHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/:path',
  async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
                path: params.path ?? 'weight.getWeights',
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
    } catch {
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
                path: params.path ?? 'weight.getWeights',
              },
            },
          },
        ],
        { status: 200 }
      );
    }

    if (userId === 'error-user-id') {
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
                path: params.path?.includes('weight.getWeights')
                  ? 'weight.getWeights'
                  : 'unknown',
              },
            },
          },
        ],
        { status: 200 }
      );
    }

    if (userId === 'empty-user-id') {
      return HttpResponse.json(
        [{ id: 0, result: { type: 'data', data: [] } }],
        { status: 200 }
      );
    }

    const mockWeights = [
      {
        id: '1',
        weightKg: 70,
        createdAt: '2023-10-01T00:00:00Z',
        note: 'Morning weigh-in',
      },
      {
        id: '2',
        weightKg: 69.5,
        createdAt: '2023-10-02T00:00:00Z',
        note: 'Evening weigh-in',
      },
    ];
    return HttpResponse.json(
      [{ id: 0, result: { type: 'data', data: mockWeights } }],
      { status: 200 }
    );
  }
);