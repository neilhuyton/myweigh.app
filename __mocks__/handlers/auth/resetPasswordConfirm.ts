import { http, HttpResponse } from "msw";
import { z } from "zod";
import { createTRPCErrorResponse, withBodyParsing } from "../../utils";

const resetPasswordConfirmInputSchema = z.object({
  token: z.string().uuid({ message: "Invalid token format" }),
  newPassword: z.string().min(1, { message: "New password is required" }),
});

export const resetPasswordConfirmHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/resetPassword.confirm",
  withBodyParsing(
    resetPasswordConfirmInputSchema,
    "resetPassword.confirm",
    async (body) => {
      const { token } = body;

      if (token === "123e4567-e29b-12d3-a456-426614174000") {
        return HttpResponse.json(
          {
            id: 0,
            result: {
              type: "data",
              data: { success: true },
            },
          },
          { status: 200 }
        );
      }

      return createTRPCErrorResponse(
        0,
        "Invalid or expired token",
        -32600,
        400,
        "resetPassword.confirm"
      );
    },
  )
);
