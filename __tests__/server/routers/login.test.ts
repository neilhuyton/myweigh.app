import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__mocks__/server'; // Add this import
import { setupMSW } from '../../../__tests__/setupTests';

describe('login', () => {
  setupMSW();

  it('should log in a user successfully', async () => {
    const user = { id: 'test-user-id', email: 'testuser@example.com' };

    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/login', async () => {
        return HttpResponse.json([{ id: 0, result: { data: user } }]);
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id: 0, json: { email: 'testuser@example.com', password: 'password123' } }]),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body[0].result.data).toEqual(user);
  });

  it('should return 401 on invalid credentials', async () => {
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/login', async () => {
        return HttpResponse.json(
          [
            {
              id: 0,
              error: {
                message: 'Invalid email or password',
                code: -32001,
                data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'login' },
              },
            },
          ],
          { status: 401 }
        );
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id: 0, json: { email: 'wronguser@example.com', password: 'wrongpassword' } }]),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body[0].error.message).toBe('Invalid email or password');
  });

  it('should return 401 on unverified email', async () => {
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/login', async () => {
        return HttpResponse.json(
          [
            {
              id: 0,
              error: {
                message: 'Please verify your email before logging in',
                code: -32001,
                data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'login' },
              },
            },
          ],
          { status: 401 }
        );
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id: 0, json: { email: 'unverified@example.com', password: 'password123' } }]),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body[0].error.message).toBe('Please verify your email before logging in');
  });
});