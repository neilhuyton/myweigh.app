// __mocks__/handlers/weightCreate.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import {
  authenticateRequest,
  createTRPCErrorResponse,
  withBodyParsing,
  type AuthenticatedUser,
} from "../utils";

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
  withBodyParsing(weightInputSchema, "weight.create", async (body, request) => {
    console.log("weight.create handler called");

    // Use the reusable authentication utility
    const authResult = authenticateRequest(request, "weight.create");
    if (authResult instanceof HttpResponse) {
      return authResult; // Return error response if authentication fails
    }
    const { userId } = authResult as AuthenticatedUser;
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
  })
);
