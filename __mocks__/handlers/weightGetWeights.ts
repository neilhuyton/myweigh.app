// __mocks__/handlers/weightGetWeights.ts
import { http, HttpResponse } from "msw";
import { verifyJWT, createTRPCErrorResponse } from "../utils";
import {
  weights,
  noChangeWeights,
  gainWeights,
  singleWeight,
} from "./weightsData";

export const weightGetWeightsHandler = http.get(
  "http://localhost:8888/.netlify/functions/trpc/weight.getWeights",
  async ({ request }) => {
    console.log("weight.getWeights handler called");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return createTRPCErrorResponse(
        0,
        "Unauthorized",
        -32001,
        401,
        "weight.getWeights"
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJWT(token);
    if (!decoded) {
      console.error("Invalid token");
      return createTRPCErrorResponse(
        0,
        "Invalid token",
        -32001,
        401,
        "weight.getWeights"
      );
    }
    const { userId } = decoded;
    console.log("Decoded userId:", userId);

    if (userId === "error-user-id") {
      console.error("Failed to fetch weights for userId:", userId);
      return createTRPCErrorResponse(
        0,
        "Failed to fetch weights",
        -32002,
        500,
        "weight.getWeights"
      );
    }

    if (userId === "empty-user-id") {
      console.log("Returning empty weights for userId:", userId);
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
      console.log("Returning no-change weights for userId:", userId);
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
      console.log("Returning gain weights for userId:", userId);
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
      console.log("Returning single weight for userId:", userId);
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

    console.log("Returning default weights for userId:", userId);
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
