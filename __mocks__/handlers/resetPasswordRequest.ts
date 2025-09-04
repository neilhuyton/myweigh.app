import { http, HttpResponse } from "msw";
import { z } from "zod";
import { createTRPCErrorResponse, withBodyParsing } from "../utils";

const resetPasswordInputSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const resetPasswordRequestHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/resetPassword.request",
  withBodyParsing(
    resetPasswordInputSchema,
    "resetPassword.request",
    async (body) => {
      const { email } = body;

      if (
        email === "nonexistent@example.com" ||
        email === "unknown@example.com"
      ) {
        return HttpResponse.json(
          {
            id: 0,
            result: {
              type: "data",
              data: {
                message: "If the email exists, a reset link has been sent.",
              },
            },
          },
          { status: 200 }
        );
      }

      if (email === "fail@example.com") {
        return createTRPCErrorResponse(
          0,
          "Failed to send reset email",
          -32002,
          500,
          "resetPassword.request"
        );
      }

      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: { message: "Reset link sent to your email" },
          },
        },
        { status: 200 }
      );
    }
  )
);
