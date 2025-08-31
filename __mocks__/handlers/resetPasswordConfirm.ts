// __mocks__/handlers/resetPasswordConfirm.ts
import { http, HttpResponse } from 'msw';
import { mockUsers, type MockUser } from '../mockUsers';
import bcrypt from 'bcryptjs';
import type { inferProcedureInput } from '@trpc/server';
import type { AppRouter } from '../../server/trpc';

interface TrpcRequestBody {
  '0': inferProcedureInput<AppRouter['resetPassword']['confirm']>; // { token: string, newPassword: string }
}

export const resetPasswordConfirmHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/resetPassword.confirm',
  async ({ request }) => {
    console.log('MSW intercepting resetPassword.confirm request');
    let body: unknown;
    try {
      body = await request.json();
      console.log('Received body:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('Error reading resetPassword.confirm request body:', error);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid request body',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword.confirm' },
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
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword.confirm' },
            },
          },
        ],
        { status: 200 }
      );
    }

    const input = (body as TrpcRequestBody)['0'];
    const { token, newPassword } = input || {};

    if (!token || !newPassword) {
      console.log('Missing token or newPassword');
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Token and new password are required',
              code: -32603,
              data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'resetPassword.confirm' },
            },
          },
        ],
        { status: 200 }
      );
    }

    const user = mockUsers.find((u: MockUser) => u.resetPasswordToken === token);
    if (!user || !user.resetPasswordTokenExpiresAt || new Date(user.resetPasswordTokenExpiresAt) < new Date()) {
      console.log('Invalid or expired token:', token);
      return HttpResponse.json(
        [
          {
            id: 0,
            error: {
              message: 'Invalid or expired token',
              code: -32001,
              data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'resetPassword.confirm' },
            },
          },
        ],
        { status: 200 }
      );
    }

    // Update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiresAt = null;
    user.updatedAt = new Date().toISOString();

    console.log('Password reset successful for user:', user.email);
    return HttpResponse.json(
      [
        {
          id: 0,
          result: {
            data: {
              message: 'Password reset successfully',
            },
          },
        },
      ],
      { status: 200 }
    );
  }
);