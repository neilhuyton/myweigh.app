import { http, HttpResponse } from 'msw';

interface TRPCRequestBody {
  id?: number;
  input?: { email: string };
  email?: string;
}

export const resetPasswordRequestHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/resetPassword.request',
  async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid request body',
            code: -32602,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword.request' },
          },
        },
        { status: 400 }
      );
    }

    let email: string | undefined;

    if (Array.isArray(body)) {
      email = body[0]?.input?.email ?? body[0]?.email;
    } else if (body && typeof body === 'object') {
      email = (body as TRPCRequestBody).input?.email ?? (body as TRPCRequestBody).email;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid email address',
            code: -32602,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword.request' },
          },
        },
        { status: 400 }
      );
    }

    if (email === 'nonexistent@example.com' || email === 'unknown@example.com') {
      return HttpResponse.json(
        { result: { data: { message: 'If the email exists, a reset link has been sent.' } } },
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (email === 'fail@example.com') {
      return HttpResponse.json(
        {
          error: {
            message: 'Failed to send reset email',
            code: -32001,
            data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500, path: 'resetPassword.request' },
          },
        },
        { status: 500 }
      );
    }

    return HttpResponse.json(
      { result: { data: { message: 'Reset link sent to your email' } } },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
);