// __mocks__/handlers/weightGetWeights.ts
import { http, HttpResponse } from 'msw';
import jwt from 'jsonwebtoken';

export const weightGetWeightsHandler = http.post(
  /http:\/\/localhost:8888\/\.netlify\/functions\/trpc\/weight\.getWeights/,
  async ({ request }) => {
    console.log('MSW: Intercepted weight.getWeights request:', request.url, request.method);
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        [{
          id: 0,
          error: {
            message: 'Unauthorized',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.getWeights' }
          }
        }],
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
        [{
          id: 0,
          error: {
            message: 'Invalid token',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.getWeights' }
          }
        }],
        { status: 200 }
      );
    }

    console.log('MSW: Handling request for userId:', userId);

    if (userId === 'error-user-id') {
      return HttpResponse.json(
        [{
          id: 0,
          error: {
            message: 'Failed to fetch weights',
            code: -32002,
            data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500, path: 'weight.getWeights' }
          }
        }],
        { status: 200 }
      );
    }

    if (userId === 'empty-user-id') {
      console.log('MSW: Returning empty weights for empty-user-id');
      return HttpResponse.json(
        [{ id: 0, result: { data: [] } }],
        { status: 200 }
      );
    }

    // Default case for test-user-id
    const mockWeights = [
      { id: '1', weightKg: 70, createdAt: '2023-10-01T00:00:00Z', note: 'Morning weigh-in' },
      { id: '2', weightKg: 69.5, createdAt: '2023-10-02T00:00:00Z', note: 'Evening weigh-in' },
    ];
    return HttpResponse.json(
      [{ id: 0, result: { data: mockWeights } }],
      { status: 200 }
    );
  }
);