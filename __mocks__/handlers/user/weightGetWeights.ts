// __mocks__/handlers/weightGetWeights.ts
import { http, HttpResponse } from "msw";
import {
  authenticateRequest,
  createTRPCErrorResponse,
  type AuthenticatedUser,
} from "../../utils";
import {
  weights,
  noChangeWeights,
  gainWeights,
  singleWeight,
} from "./weightsData";

export const weightGetWeightsHandler = http.get(
  "http://localhost:8888/.netlify/functions/trpc/weight.getWeights",
  async ({ request }) => {
    // Use the reusable authentication utility
    const authResult = authenticateRequest(request, "weight.getWeights");
    if (authResult instanceof HttpResponse) {
      return authResult; // Return error response if authentication fails
    }
    const { userId } = authResult as AuthenticatedUser;

    if (userId === "error-user-id") {
      return createTRPCErrorResponse(
        0,
        "Failed to fetch weights",
        -32002,
        500,
        "weight.getWeights"
      );
    }

    if (userId === "empty-user-id") {
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: [],
          },
        },
        { status: 200 }
      );
    }

    if (userId === "no-change-user-id") {
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: noChangeWeights,
          },
        },
        { status: 200 }
      );
    }

    if (userId === "gain-user-id") {
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: gainWeights,
          },
        },
        { status: 200 }
      );
    }

    if (userId === "single-user-id") {
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: singleWeight,
          },
        },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      {
        id: 0,
        result: {
          type: "data",
          data: weights,
        },
      },
      { status: 200 }
    );
  }
);
