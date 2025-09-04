// __mocks__/handlers/resetPasswordRequest.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import { parseBody, createTRPCErrorResponse } from "../utils";

const resetPasswordInputSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const resetPasswordRequestHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/resetPassword.request",
  async ({ request }) => {
    console.log("resetPassword.request handler called");

    let body: { email: string };
    try {
      body = await parseBody(
        request,
        resetPasswordInputSchema,
        "resetPassword.request"
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
        "resetPassword.request"
      );
    }

    const { email } = body;

    if (
      email === "nonexistent@example.com" ||
      email === "unknown@example.com"
    ) {
      console.log("Returning neutral response for email:", email);
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
      console.error("Simulating server error for email:", email);
      return createTRPCErrorResponse(
        0,
        "Failed to send reset email",
        -32002,
        500,
        "resetPassword.request"
      );
    }

    console.log("Returning success response for email:", email);
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
);
