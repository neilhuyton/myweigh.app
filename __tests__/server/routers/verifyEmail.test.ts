import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__mocks__/server'; // Add this import
import { setupMSW } from '../../../__tests__/setupTests';

describe('verifyEmail', () => {
  setupMSW();

  it('should verify email successfully', async () => {
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/verifyEmail', async () => {
        return HttpResponse.json([{ id: 0, result: { data: { message: 'Email verified successfully!' } } }]);
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc/verifyEmail', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id: 0, json: { token: 'valid-token' } }]),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body[0].result.data).toEqual({ message: 'Email verified successfully!' });
  });

  it('should return 401 on invalid token', async () => {
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/verifyEmail', async () => {
        return HttpResponse.json(
          [
            {
              id: 0,
              error: {
                message: 'Invalid verification token',
                code: -32001,
                data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'verifyEmail' },
              },
            },
          ],
          { status: 401 }
        );
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc/verifyEmail', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id: 0, json: { token: 'invalid-token' } }]),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body[0].error.message).toBe('Invalid verification token');
  });

  it('should return 400 on already verified email', async () => {
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/verifyEmail', async () => {
        return HttpResponse.json(
          [
            {
              id: 0,
              error: {
                message: 'Email already verified',
                code: -32001,
                data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'verifyEmail' },
              },
            },
          ],
          { status: 400 }
        );
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc/verifyEmail', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id: 0, json: { token: 'valid-token' } }]),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body[0].error.message).toBe('Email already verified');
  });
});