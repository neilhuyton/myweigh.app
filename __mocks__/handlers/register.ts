// __mocks__/handlers/register.ts
import { http, HttpResponse } from 'msw';
import { mockUsers } from '../mockUsers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

interface TrpcRequestBody {
  id: number;
  json: { input: { email: string; password: string } };
}

export const registerHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/register',
  async ({ request }) => {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error reading register request body:', error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 400 }
      );
    }

    const { id = 0, json: { input } = {} } = (body as TrpcRequestBody[])[0] || {};

    if (!input?.email || !input?.password) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Email and password are required',
              code: -32603,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 400 }
      );
    }

    if (!input.email.includes('@')) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Invalid email address',
              code: -32001,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 400 }
      );
    }

    if (input.password.length < 8) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Password must be at least 8 characters',
              code: -32001,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 400 }
      );
    }

    if (mockUsers.find((u) => u.email === input.email)) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Email already exists',
              code: -32603,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const newUser = {
      id: crypto.randomUUID(),
      email: input.email,
      password: hashedPassword,
      verificationToken: crypto.randomUUID(),
      isEmailVerified: false,
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);

    return HttpResponse.json([
      {
        id,
        result: {
          data: {
            id: newUser.id,
            email: newUser.email,
            message: 'Registration successful! Please check your email to verify your account.',
          },
        },
      },
    ]);
  }
);