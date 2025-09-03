// __mocks__/handlers/weightGetWeights.ts
import { http, HttpResponse } from "msw";
import jwt from "jsonwebtoken";
import { weights, noChangeWeights, gainWeights, singleWeight } from "./weightsData";

export const weightGetWeightsHandler = http.get(
  "http://localhost:8888/.netlify/functions/trpc/weight.getWeights",
  async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Unauthorized",
            code: -32001,
            data: {
              code: "UNAUTHORIZED",
              httpStatus: 401,
              path: "weight.getWeights",
            },
          },
        },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.split(" ")[1];
    let userId: string | null = null;
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as { userId: string };
      userId = decoded.userId;
    } catch {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Invalid token",
            code: -32001,
            data: {
              code: "UNAUTHORIZED",
              httpStatus: 401,
              path: "weight.getWeights",
            },
          },
        },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (userId === "error-user-id") {
      return HttpResponse.json(
        {
          id: 0,
          error: {
            message: "Failed to fetch weights",
            code: -32002,
            data: {
              code: "INTERNAL_SERVER_ERROR",
              httpStatus: 500,
              path: "weight.getWeights",
            },
          },
        },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (userId === "empty-user-id") {
      return HttpResponse.json(
        { id: 0, result: { type: "data", data: [] } },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (userId === "no-change-user-id") {
      return HttpResponse.json(
        { id: 0, result: { type: "data", data: noChangeWeights } },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (userId === "gain-user-id") {
      return HttpResponse.json(
        { id: 0, result: { type: "data", data: gainWeights } },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (userId === "single-user-id") {
      return HttpResponse.json(
        { id: 0, result: { type: "data", data: singleWeight } },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return HttpResponse.json(
      { id: 0, result: { type: "data", data: weights } },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
);