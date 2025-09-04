import { http, HttpResponse } from "msw";
import { z } from "zod";
import { createTRPCErrorResponse, withBodyParsing } from "../../utils";
import { mockUsers, type MockUser } from "../../mockUsers";

const verifyEmailInputSchema = z.object({
  token: z.string().uuid({ message: "Invalid token format" }),
});

export const verifyEmailHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/verifyEmail",
  withBodyParsing(verifyEmailInputSchema, "verifyEmail", async (body) => {
    const { token } = body;

    const user = mockUsers.find((u: MockUser) => u.verificationToken === token);
    if (!user) {
      return createTRPCErrorResponse(
        0,
        "Invalid or expired verification token",
        -32602,
        400,
        "verifyEmail"
      );
    }

    if (user.isEmailVerified) {
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
  })
);
