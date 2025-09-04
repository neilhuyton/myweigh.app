// __mocks__/handlers/weightDelete.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import {
  authenticateRequest,
  createTRPCErrorResponse,
  withBodyParsing,
  type AuthenticatedUser,
} from "../../utils";
import { weights } from "./weightsData";

const weightDeleteInputSchema = z.object({
  weightId: z.string().uuid({ message: "Invalid weight ID" }),
});

export const weightDeleteHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/weight.delete",
  withBodyParsing(
    weightDeleteInputSchema,
    "weight.delete",
    async (body, request) => {
      // Use the reusable authentication utility
      const authResult = authenticateRequest(request, "weight.delete");
      if (authResult instanceof HttpResponse) {
        return authResult; // Return error response if authentication fails
      }
      const { userId } = authResult as AuthenticatedUser;

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
  )
);
