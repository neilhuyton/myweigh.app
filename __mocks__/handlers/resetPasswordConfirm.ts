// __mocks__/handlers/resetPasswordConfirm.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import { parseBody, createTRPCErrorResponse } from "../utils";

const resetPasswordConfirmInputSchema = z.object({
  token: z.string().uuid({ message: "Invalid token format" }),
  newPassword: z.string().min(1, { message: "New password is required" }),
});

export const resetPasswordConfirmHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/resetPassword.confirm",
  async ({ request }) => {
    console.log("resetPassword.confirm handler called");

    let body: { token: string; newPassword: string };
    try {
      body = await parseBody(
        request,
        resetPasswordConfirmInputSchema,
        "resetPassword.confirm"
      );
      console.log("Parsed body:", JSON.stringify(body));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error parsing request body";
      console.error(message);
      return createTRPCErrorResponse(
        0,
        message,
        -32600,
        400,
        "resetPassword.confirm"
      );
    }

    const { token } = body;

    if (token === "123e4567-e29b-12d3-a456-426614174000") {
      console.log("Returning success response for valid token");
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

    console.error("Invalid or expired token:", token);
    return createTRPCErrorResponse(
      0,
      "Invalid or expired token",
      -32600,
      400,
      "resetPassword.confirm"
    );
  }
);
