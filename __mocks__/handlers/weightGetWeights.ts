// __mocks__/handlers/weightGetWeights.ts
import { http, HttpResponse } from 'msw';

export const weightGetWeightsHandler = http.get(
  'http://localhost:8888/.netlify/functions/trpc/weight.getWeights',
  async ({ request }) => {
    console.log('Handling weight.getWeights request:', request.url, request.headers.get('authorization'));
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
  }
);