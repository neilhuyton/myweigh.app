// __mocks__/handlers/weightGetGoal.ts
import { http, HttpResponse } from 'msw';

export const weightGetGoalHandler = http.get(
  'http://localhost:8888/.netlify/functions/trpc/weight.getGoal',
  async ({ request }) => {
    console.log('Handling weight.getGoal request:', request.url, request.headers.get('authorization'));
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
  }
);