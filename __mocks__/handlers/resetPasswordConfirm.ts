// __mocks__/handlers/resetPasswordConfirm.ts
import { http, HttpResponse } from 'msw';
import { mockUsers, type MockUser } from '../mockUsers';
import bcrypt from 'bcryptjs';

interface TrpcRequestBody {
  id: number;
  json: { input: { token: string; newPassword: string } };
}

export const resetPasswordConfirmHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/resetPassword.confirm',
  async ({ request }) => {
    const body = (await request.json()) as TrpcRequestBody[];
    const {
      id = 0,
      json: { input },
    } = body[0] || {};

    if (!input?.token || !input?.newPassword) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Token and new password are required',
              code: -32603,
              data: {
                code: 'BAD_REQUEST',
                httpStatus: 400,
                path: 'resetPassword.confirm',
              },
            },
          },
        ],
        { status: 400 }
      );
    }

    const user = mockUsers.find((u: MockUser) => u.resetPasswordToken === input.token);
    if (!user || !user.resetPasswordTokenExpiresAt || new Date(user.resetPasswordTokenExpiresAt) < new Date()) {
      return HttpResponse.json(
        [
          {
            id,
            error: {
              message: 'Invalid or expired token',
              code: -32001,
              data: {
                code: 'UNAUTHORIZED',
                httpStatus: 401,
                path: 'resetPassword.confirm',
              },
            },
          },
        ],
        { status: 401 }
      );
    }

    // Update the user's password
    const hashedPassword = await bcrypt.hash(input.newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null; // Now allowed by MockUser type
    user.resetPasswordTokenExpiresAt = null;
    user.updatedAt = new Date().toISOString();

    return HttpResponse.json(
      [
        {
          id,
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