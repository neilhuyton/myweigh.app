// __mocks__/handlers/weightSetGoal.ts
import { http, HttpResponse } from 'msw';

export const weightSetGoalHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/weight.setGoal',
  async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error reading weight.setGoal request body:', error);
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

    const headers = Object.fromEntries(request.headers.entries());
    const input = (body as { [key: string]: { id?: number; goalWeightKg?: number } })['0'];
    const id = input?.id ?? 0;
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
);