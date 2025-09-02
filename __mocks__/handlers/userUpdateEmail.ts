import { http, HttpResponse } from 'msw';
import jwt from 'jsonwebtoken';

interface TRPCRequestBody {
  id?: number;
  input?: { email: string };
  email?: string;
}

export const userUpdateEmailHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/user.updateEmail',
  async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          error: {
            message: 'Unauthorized: User must be logged in',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'user.updateEmail' },
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    // Bypass JWT verification for test token
    if (token === 'mock-token-test-user-id') {
      const userId = 'test-user-id';
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return HttpResponse.json(
          {
            error: {
              message: 'Invalid request body',
              code: -32602,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'user.updateEmail' },
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
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'user.updateEmail' },
            },
          },
          { status: 400 }
        );
      }

      if (email === 'existing@example.com') {
        return HttpResponse.json(
          {
            error: {
              message: 'Email already in use',
              code: -32602,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'user.updateEmail' },
            },
          },
          { status: 400 }
        );
      }

      if (email === 'newemail@example.com') {
        return HttpResponse.json(
          {
            result: {
              data: { message: 'Email updated successfully', email },
            },
          },
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return HttpResponse.json(
        {
          error: {
            message: 'User not found',
            code: -32001,
            data: { code: 'NOT_FOUND', httpStatus: 404, path: 'user.updateEmail' },
          },
        },
        { status: 404 }
      );
    }

    // Original JWT verification for non-test cases
    let userId: string | null = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
        userId: string;
      };
      userId = decoded.userId;
    } catch {
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid token',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'user.updateEmail' },
          },
        },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        {
          error: {
            message: 'Invalid request body',
            code: -32602,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'user.updateEmail' },
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
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'user.updateEmail' },
          },
        },
        { status: 400 }
      );
    }

    if (userId === 'test-user-id' && email === 'newemail@example.com') {
      return HttpResponse.json(
        {
          result: {
            data: { message: 'Email updated successfully', email },
          },
        },
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (email === 'existing@example.com') {
      return HttpResponse.json(
        {
          error: {
            message: 'Email already in use',
            code: -32602,
            data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'user.updateEmail' },
          },
        },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        error: {
          message: 'User not found',
          code: -32001,
          data: { code: 'NOT_FOUND', httpStatus: 404, path: 'user.updateEmail' },
        },
      },
      { status: 404 }
    );
  }
);