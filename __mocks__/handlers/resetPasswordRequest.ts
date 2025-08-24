import { http, HttpResponse } from 'msw';

interface TrpcRequestBody {
  id: number;
  json: { input: { email?: string } };
}

export const resetPasswordRequestHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/resetPassword.request',
  async ({ request }) => {
    const body = (await request.json()) as TrpcRequestBody[];
    const {
      id = 0,
      json: { input },
    } = body[0] || {};

    if (!input?.email) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Invalid email',
              code: -32603,
              data: {
                code: 'BAD_REQUEST',
                httpStatus: 400,
                path: 'resetPassword.request',
              },
            },
          },
        ],
        { status: 400 }
      );
    }

    return HttpResponse.json(
      [
        {
          id,
          result: {
            data: {
              message: 'If the email exists, a reset link has been sent.',
            },
          },
        },
      ],
      { status: 200 }
    );
  }
);