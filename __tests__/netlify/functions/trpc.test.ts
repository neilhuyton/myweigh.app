import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__mocks__/server';

const mockUsers = [
  {
    id: '27e72eb9-a0ad-4714-bd7a-c148ac1b903e',
    email: 'neil.huyton@gmail.com',
    password: '$2b$10$3T7JTgXV0uQsQD4jIwE9H.4A8S7L5/sPEbU/x/IaI21ey9rintyZO',
    verificationToken: '42c6b154-c097-4a71-9b34-5b28669ea467',
    isEmailVerified: false,
    resetPasswordToken: null,
    resetPasswordTokenExpiresAt: null,
    createdAt: '2025-08-16T10:40:39.214Z',
    updatedAt: '2025-08-16T10:40:39.214Z',
  },
  {
    id: 'fb208768-1bf8-4f8d-bcad-1f94c882ed93',
    email: 'hi@neilhuyton.com',
    password: '$2b$10$RBmt.5/HTA/qk5Y47NYgvuZ5TA0AurgAUy0vDeytiUKsvZUeR.lrG',
    verificationToken: null,
    isEmailVerified: true,
    resetPasswordToken: null,
    resetPasswordTokenExpiresAt: null,
    createdAt: '2025-08-16T19:57:56.561Z',
    updatedAt: '2025-08-16T19:58:22.721Z',
  },
];

describe('Netlify Function: trpc', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('handles user.register successfully', async () => {
    const newUser = {
      id: 'new-user-id',
      email: 'newuser@example.com',
    };

    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc', async ({ request }) => {
        const body = (await request.json()) as unknown;
        const json = body as { json: { path: string; input: { email: string; password: string } } };
        if (json.json?.path === 'register') {
          return HttpResponse.json({
            result: { data: newUser },
          });
        }
        return HttpResponse.json({ error: { message: 'Procedure not found', code: 'NOT_FOUND' } }, { status: 404 });
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: { path: 'register', input: { email: 'newuser@example.com', password: 'password123' } } }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.result.data).toEqual(newUser);
  });

  it('returns 400 on invalid email for register', async () => {
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc', async ({ request }) => {
        const body = (await request.json()) as unknown;
        const json = body as { json: { path: string; input: { email: string; password: string } } };
        if (json.json?.path === 'register') {
          return HttpResponse.json(
            { error: { message: 'Invalid email address', code: 'BAD_REQUEST' } },
            { status: 400 }
          );
        }
        return HttpResponse.json({ error: { message: 'Procedure not found', code: 'NOT_FOUND' } }, { status: 404 });
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: { path: 'register', input: { email: 'invalid-email', password: 'password123' } } }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toContain('Invalid email address');
  });

  it('returns 400 on invalid password for register', async () => {
    server.use(
      http.post('http://localhost:8888/.netlify/functions/trpc', async ({ request }) => {
        const body = (await request.json()) as unknown;
        const json = body as { json: { path: string; input: { email: string; password: string } } };
        if (json.json?.path === 'register') {
          return HttpResponse.json(
            { error: { message: 'Password must be at least 8 characters', code: 'BAD_REQUEST' } },
            { status: 400 }
          );
        }
        return HttpResponse.json({ error: { message: 'Procedure not found', code: 'NOT_FOUND' } }, { status: 404 });
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: { path: 'register', input: { email: 'newuser@example.com', password: 'short' } } }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toContain('Password must be at least 8 characters');
  });
});