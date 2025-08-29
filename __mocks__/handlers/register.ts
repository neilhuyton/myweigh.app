// __mocks__/handlers/register.ts
import { http, HttpResponse } from 'msw';
import { mockUsers } from '../mockUsers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { inferProcedureInput } from '@trpc/server';
import type { AppRouter } from '../../server/trpc';

interface TrpcRequestBody {
  '0': inferProcedureInput<AppRouter['register']>; // { email: string, password: string }
}

export const registerHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/register',
  async ({ request }) => {
    console.log('MSW intercepting register request');
    let body: unknown;
    try {
      body = await request.json();
      console.log('Received body:', JSON.stringify(body, null, 2));
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
        { status: 200 }
      );
    }

    // Check if body is an object with a "0" key
    if (!body || typeof body !== 'object' || !('0' in body)) {
      console.error('Invalid body format: not an object with "0" key');
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
        { status: 200 }
      );
    }

    const input = (body as TrpcRequestBody)['0'];
    const { email, password } = input || {};

    if (!email || !password) {
      console.log('Missing email or password');
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Email and password are required',
              code: -32603,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 200 }
      );
    }

    if (!email.includes('@')) {
      console.log('Invalid email address:', email);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid email address',
              code: -32001,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 200 }
      );
    }

    if (password.length < 8) {
      console.log('Password too short:', password.length);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Password must be at least 8 characters',
              code: -32001,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 200 }
      );
    }

    if (mockUsers.find((u) => u.email === email)) {
      console.log('Email already exists:', email);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Email already exists',
              code: -32603,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
            },
          },
        ],
        { status: 200 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      verificationToken: crypto.randomUUID(),
      isEmailVerified: false,
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);

    console.log('Registration successful for user:', email);
    return HttpResponse.json(
      [
        {
          id: 0,
          result: {
            data: {
              id: newUser.id,
              email: newUser.email,
              message: 'Registration successful! Please check your email to verify your account.',
            },
          },
        },
      ],
      { status: 200 }
    );
  }
);