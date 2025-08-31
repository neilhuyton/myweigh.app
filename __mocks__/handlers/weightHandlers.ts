import { http, HttpResponse } from 'msw';

// Define input type for weight.setGoal
interface WeightSetGoalInput {
  goalWeightKg: number;
}

// Define the shape of a single tRPC request
interface TRPCRequest {
  path: string;
  input?: WeightSetGoalInput | Record<string, never>;
  id?: number;
}

// Define the shape of the request body (for batch requests)
type TRPCRequestBody = { [key: string]: TRPCRequest };

export const weightHandlers = [
  http.post('http://localhost:8888/.netlify/functions/trpc', async ({ request }) => {
    const headers = Object.fromEntries(request.headers.entries());
    const userId = headers['authorization']?.split('Bearer ')[1];
    const body = (await request.json()) as TRPCRequestBody;
    const query = body['0'];
    console.log('Mock server received request:', { path: query.path, headers, body });

    if (!userId) {
      console.log(`Unauthorized request detected for ${query.path}`);
      return HttpResponse.json(
        [
          {
            error: {
              message: 'Unauthorized: User must be logged in',
              code: -32001,
              data: { code: 'UNAUTHORIZED', httpStatus: 401, path: query.path },
            },
          },
        ],
        { status: 401 },
      );
    }

    if (query.path === 'weight.getCurrentGoal') {
      console.log('Returning weight.getCurrentGoal response');
      return HttpResponse.json([
        {
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
    }

    if (query.path === 'weight.getGoals') {
      console.log('Returning weight.getGoals response');
      return HttpResponse.json([
        {
          result: {
            data: [
              {
                id: 'goal-1',
                goalWeightKg: 65.0,
                goalSetAt: '2025-08-28T12:00:00Z',
                reachedAt: null,
              },
              {
                id: 'goal-2',
                goalWeightKg: 70.0,
                goalSetAt: '2025-08-27T12:00:00Z',
                reachedAt: null,
              },
            ],
          },
        },
      ]);
    }

    if (query.path === 'weight.getWeights') {
      console.log('Returning weight.getWeights response');
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

    if (query.path === 'weight.setGoal') {
      const input = query.input as WeightSetGoalInput | undefined;
      console.log('Handling weight.setGoal with input:', input);
      if (!input || input.goalWeightKg <= 0) {
        console.log('Invalid goal weight');
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
          { status: 400 },
        );
      }
      console.log('Returning weight.setGoal response');
      return HttpResponse.json([
        {
          id: query.id ?? 0,
          result: {
            data: {
              id: 'goal-new',
              goalWeightKg: input.goalWeightKg,
              goalSetAt: '2025-08-28T12:00:00Z',
              reachedAt: null,
            },
          },
        },
      ]);
    }

    console.log(`No handler for path: ${query.path}`);
    return HttpResponse.json(
      [
        {
          error: {
            message: 'Unknown endpoint',
            code: -32001,
            data: { code: 'NOT_FOUND', httpStatus: 404, path: query.path },
          },
        },
      ],
      { status: 404 },
    );
  }),
];