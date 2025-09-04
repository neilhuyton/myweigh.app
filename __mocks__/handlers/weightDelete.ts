// __mocks__/handlers/weightDelete.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import { parseBody, verifyJWT, createTRPCErrorResponse } from "../utils";
import { weights } from "./weightsData";

const weightDeleteInputSchema = z.object({
  weightId: z.string().uuid({ message: "Invalid weight ID" }),
});

export const weightDeleteHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/weight.delete",
  async ({ request }) => {
    const clonedRequest = request.clone();

    let body: { weightId: string };
    try {
      body = await parseBody(
        clonedRequest,
        weightDeleteInputSchema,
        "weight.delete"
      );
    } catch (error) {
      return createTRPCErrorResponse(
        0,
        error instanceof Error ? error.message : "Invalid request body",
        -32600,
        400,
        "weight.delete"
      );
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return createTRPCErrorResponse(
        0,
        "Unauthorized: User must be logged in",
        -32001,
        401,
        "weight.delete"
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJWT(token);
    if (!decoded) {
      return createTRPCErrorResponse(
        0,
        "Invalid token",
        -32001,
        401,
        "weight.delete"
      );
    }
    const { userId } = decoded;

    const { weightId } = body;

    if (userId === "error-user-id") {
      return createTRPCErrorResponse(
        0,
        "Failed to delete weight",
        -32002,
        500,
        "weight.delete"
      );
    }

    const weight = weights.find((w) => w.id === weightId);
    if (!weight) {
      return createTRPCErrorResponse(
        0,
        "Weight measurement not found",
        -32602,
        404,
        "weight.delete"
      );
    }

    if (weight.userId !== userId) {
      return createTRPCErrorResponse(
        0,
        "Unauthorized: Cannot delete another user's weight measurement",
        -32001,
        401,
        "weight.delete"
      );
    }

    const weightIndex = weights.findIndex((w) => w.id === weightId);
    weights.splice(weightIndex, 1);

    return HttpResponse.json(
      {
        id: 0,
        result: {
          type: "data",
          data: { id: weightId },
        },
      },
      { status: 200 }
    );
  }
);