import { http, HttpResponse } from 'msw';
import { mockUsers, type MockUser } from '../mockUsers';
import bcrypt from 'bcryptjs';

export const loginHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/login',
  async ({ request }) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    let body: unknown;
    try {
      body = await request.json();
      console.log('LoginHandler Request body:', body); // Debug log
    } catch (error) {
      console.error('LoginHandler Failed to parse request body:', error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'login' },
            },
          },
        ],
        { status: 200 }
      );
    }

    // Handle tRPC body format: { '0': { email, password } } or [{ json: { email, password } }]
    const input =
      body && typeof body === 'object' && '0' in body
        ? body['0']
        : Array.isArray(body) && body[0]?.json
          ? body[0].json
          : body;

    if (!input || !input.email || !input.password) {
      console.log('LoginHandler Validation failed, input:', input); // Debug log
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid email or password',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'login' },
            },
          },
        ],
        { status: 200 }
      );
    }

    const { email, password } = input;

    const user = mockUsers.find((u: MockUser) => u.email === email);
    if (!user) {
      console.log('LoginHandler User not found for email:', email); // Debug log
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid email or password',
              code: -32602,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'login' },
            },
          },
        ],
        { status: 200 }
      );
    }

    if (!user.isEmailVerified) {
      console.log('LoginHandler Email not verified for user:', email); // Debug log
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Please verify your email before logging in',
              code: -32602,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'login' },
            },
          },
        ],
        { status: 200 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('LoginHandler Password invalid for email:', email); // Debug log
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid email or password',
              code: -32602,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'login' },
            },
          },
        ],
        { status: 200 }
      );
    }

    console.log('LoginHandler Success for user:', user.id); // Debug log
    return HttpResponse.json(
      [
        {
          id: 0,
          result: {
            type: 'data',
            data: {
              id: user.id,
              email: user.email,
              token:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSJ9.dummy-signature',
              refreshToken: user.refreshToken || 'mock-refresh-token',
            },
          },
        },
      ],
      { status: 200 }
    );
  }
);