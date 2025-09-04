// __mocks__/handlers/weightCreate.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import { parseBody, createTRPCErrorResponse, verifyJWT } from "../utils";

const twoDecimalPlaces = z
  .number()
  .positive({ message: "Weight must be a positive number" })
  .refine(
    (val) => {
      const decimalPlaces = val.toString().split(".")[1]?.length || 0;
      return decimalPlaces <= 2;
    },
    { message: "Weight can have up to two decimal places" }
  );

const weightInputSchema = z.object({
  weightKg: twoDecimalPlaces,
  note: z.string().optional(),
});

export const weightCreateHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/weight.create",
  async ({ request }) => {
    console.log("weight.create handler called");

    let body: { weightKg: number; note?: string };
    try {
      body = await parseBody(request, weightInputSchema, "weight.create");
      console.log("Parsed body:", JSON.stringify(body));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error parsing request body";
      console.error(message);
      return createTRPCErrorResponse(0, message, -32600, 400, "weight.create");
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return createTRPCErrorResponse(
        0,
        "Unauthorized: User must be logged in",
        -32001,
        401,
        "weight.create"
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
        "weight.create"
      );
    }
    const { userId } = decoded;
    console.log("Decoded userId:", userId);

    const { weightKg, note } = body;

    if (userId === "test-user-id" || userId === "empty-user-id") {
      console.log("Returning success response for userId:", userId);
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: {
              id: "550e8400-e29b-41d4-a716-446655440000",
              userId,
              weightKg: Number(weightKg.toFixed(2)),
              note: note || null,
              createdAt: new Date().toISOString(),
            },
          },
        },
        { status: 200 }
      );
    }

    if (userId === "error-user-id") {
      console.error("Simulating server error for userId:", userId);
      return createTRPCErrorResponse(
        0,
        "Failed to create weight",
        -32002,
        500,
        "weight.create"
      );
    }

    console.error("Unauthorized userId:", userId);
    return createTRPCErrorResponse(
      0,
      "Unauthorized: Invalid user ID",
      -32001,
      401,
      "weight.create"
    );
  }
);
