// __mocks__/handlers/getUsers.ts
import { http, HttpResponse } from 'msw';

export const getUsersHandler = http.get(
  'http://localhost:8888/.netlify/functions/trpc/getUsers',
  async ({ request }) => {
    const response = [
      {
        result: {
          data: [
            {
              id: '27e72eb9-a0ad-4714-bd7a-c148ac1b903e',
              email: 'neil.huyton@gmail.com',
            },
            {
              id: 'fb208768-1bf8-4f8d-bcad-1f94c882ed93',
              email: 'hi@neilhuyton.com',
            },
          ],
        },
      },
    ];
    return HttpResponse.json(response, { status: 200 });
  }
);