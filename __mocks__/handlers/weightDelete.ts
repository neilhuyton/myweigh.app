// __mocks__/handlers/weightDelete.ts
import { http, HttpResponse } from 'msw';
import jwt from 'jsonwebtoken';

export const weightDeleteHandler = http.post(
  'http://localhost:8888/.netlify/functions/trpc/weight.delete',
  async ({ request }) => {
    console.log("weightDeleteHandler called", {
      headers: Object.fromEntries(request.headers.entries()),
      url: request.url,
    });
    const headers = Object.fromEntries(request.headers.entries());
    const authHeader = headers['authorization'];
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decoded = jwt.verify(token, 'your-secret-key') as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        console.error("JWT verification failed:", error);
      }
    }

    // Allow requests without auth for testing, as in WeightChart.test.tsx
    // if (!userId) {
    //   return HttpResponse.json(
    //     [
    //       {
    //         error: {
    //           message: 'Unauthorized: User must be logged in',
    //           code: -32001,
    //           data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'weight.delete' },
    //         },
    //       },
    //     ],
    //     { status: 401 }
    //   );
    // }

    console.log("Returning delete success");
    return HttpResponse.json([
      {
        result: {
          data: { success: true },
        },
      },
    ]);
  }
);