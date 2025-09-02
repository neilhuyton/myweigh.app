import { http, HttpResponse } from 'msw';
import jwt from 'jsonwebtoken';

export const authLogoutHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/auth.logout',
  async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch {
      return HttpResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      { message: 'Logged out successfully' },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
);