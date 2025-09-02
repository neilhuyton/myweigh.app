import { http, HttpResponse } from 'msw';

interface TRPCRequestBody {
  json: unknown;
  id?: number;
  path?: string;
}

export const catchAllHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/:procedure',
  async ({ request, params }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: 'Invalid request body',
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: params.procedure ?? 'unknown' },
          },
        },
        { status: 400 }
      );
    }

    const input = (body && typeof body === 'object' && 'json' in body
      ? body
      : Array.isArray(body) && body[0] && typeof body[0] === 'object' && 'json' in body[0]
      ? body[0]
      : { json: {}, id: 0 }) as TRPCRequestBody;

    // Normalize params.procedure to a string
    const procedure = Array.isArray(params.procedure)
      ? params.procedure.join(',')
      : params.procedure || 'unknown';
    const path = (input.path || procedure) as string; // Assert as string since procedure is now string
    const id = input.id ?? 0;
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.match(/test-user-id/)
      ? 'test-user-id'
      : authHeader?.match(/empty-user-id/)
      ? 'empty-user-id'
      : authHeader?.match(/error-user-id/)
      ? 'error-user-id'
      : null;

    // Handle invalid batched procedure paths
    if (procedure.includes(',')) {
      return HttpResponse.json(
        {
          id,
          error: {
            message: `Invalid procedure path: ${procedure}`,
            code: -32601,
            data: { code: 'NOT_FOUND', httpStatus: 404, path: procedure },
          },
        },
        { status: 404 }
      );
    }

    // Skip known procedures to avoid interference
    if (
      [
        'verifyEmail',
        'weight.getGoals',
        'weight.getGoal',
        'weight.getCurrentGoal',
        'resetPassword.confirm',
        'resetPassword.request',
        'refreshToken.refresh',
        'weight.setGoal',
        'weight.updateGoal',
        'login',
      ].includes(path)
    ) {
      return; // Pass to specific handlers
    }

    // Handle specific test cases for weight.getWeights
    if (path === 'weight.getWeights') {
      if (userId === 'test-user-id') {
        return HttpResponse.json(
          {
            id,
            result: {
              type: 'data',
              data: [
                { id: 1, weight: 70, date: '2025-08-01', goal: 65 },
                { id: 2, weight: 69, date: '2025-08-02', goal: 65 },
              ],
            },
          },
          { status: 200 }
        );
      } else if (userId === 'empty-user-id') {
        return HttpResponse.json(
          {
            id,
            result: {
              type: 'data',
              data: [],
            },
          },
          { status: 200 }
        );
      } else if (userId === 'error-user-id') {
        return HttpResponse.json(
          {
            id,
            error: {
              message: 'Failed to fetch weights',
              code: -32000,
              data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500, path },
            },
          },
          { status: 500 }
        );
      }
    }

    return HttpResponse.json(
      {
        id,
        error: {
          message: 'Procedure not found',
          code: -32601,
          data: { code: 'NOT_FOUND', httpStatus: 404, path },
        },
      },
      { status: 404 }
    );
  }
);