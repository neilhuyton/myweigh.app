import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../__mocks__/server'; // Add this import
import { setupMSW } from '../../../__tests__/setupTests';
import { mockUsers } from '../../../__mocks__/mockUsers';

describe('getUsers', () => {
  setupMSW();

  it('should return a list of users', async () => {
    server.use(
      http.get('http://localhost:8888/.netlify/functions/trpc/getUsers', async () => {
        return HttpResponse.json([{ id: 0, result: { data: mockUsers } }]);
      })
    );

    const response = await fetch('http://localhost:8888/.netlify/functions/trpc/getUsers', {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body[0].result.data).toEqual(mockUsers);
  });
});