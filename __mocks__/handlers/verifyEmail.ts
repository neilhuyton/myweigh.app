// __mocks__/handlers/verifyEmail.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import { createTRPCErrorResponse, withBodyParsing } from "../utils";
import { mockUsers, type MockUser } from "../mockUsers";

const verifyEmailInputSchema = z.object({
  token: z.string().uuid({ message: "Invalid token format" }),
});

export const verifyEmailHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/verifyEmail",
  withBodyParsing(
    verifyEmailInputSchema,
    "verifyEmail",
    async (body) => {
      console.log("verifyEmail handler called");

      const { token } = body;

      const user = mockUsers.find(
        (u: MockUser) => u.verificationToken === token
      );
      if (!user) {
        console.error("Invalid or expired verification token:", token);
        return createTRPCErrorResponse(
          0,
          "Invalid or expired verification token",
          -32602,
          400,
          "verifyEmail"
        );
      }

      if (user.isEmailVerified) {
        console.error("Email already verified for user:", user.id);
        return createTRPCErrorResponse(
          0,
          "Email already verified",
          -32602,
          400,
          "verifyEmail"
        );
      }

      user.isEmailVerified = true;
      user.verificationToken = null;
      user.updatedAt = new Date().toISOString();
      console.log("Email verified for user:", user.id);

      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: { message: "Email verified successfully!" },
          },
        },
        { status: 200 }
      );
    },
    false
  ) // Disable Parsed body logging
);
