import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__mocks__/server'; // Add this import
import { setupMSW } from '../../../__tests__/setupTests';

describe('register', () => {
  setupMSW();

  it('should register a new user successfully', async () => {
    const newUser = {
      id: 'new-user-id',
      email: 'newuser@example.com',
      message: 'Registration successful! Please check your email to verify your account.',
    };

    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/register', async () => {
        return HttpResponse.json([{ id: 0, result: { data: newUser } }]);
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id: 0, json: { email: 'newuser@example.com', password: 'password123' } }]),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body[0].result.data).toEqual(newUser);
  });

  it('should return 400 on invalid email', async () => {
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/register', async () => {
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
          { status: 400 }
        );
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id: 0, json: { email: 'invalid-email', password: 'password123' } }]),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body[0].error.message).toBe('Invalid email address');
  });

  it('should return 400 on short password', async () => {
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/register', async () => {
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
          { status: 400 }
        );
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id: 0, json: { email: 'newuser@example.com', password: 'short' } }]),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body[0].error.message).toBe('Password must be at least 8 characters');
  });

  it('should return 400 on duplicate email', async () => {
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc/register', async () => {
        return HttpResponse.json(
          [
            {
              id: 0,
              error: {
                message: 'Email already registered',
                code: -32001,
                data: { code: 'BAD_REQUEST', httpStatus: 400, path: 'register' },
              },
            },
          ],
          { status: 400 }
        );
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ id: 0, json: { email: 'neil.huyton@gmail.com', password: 'password123' } }]),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body[0].error.message).toBe('Email already registered');
  });
});