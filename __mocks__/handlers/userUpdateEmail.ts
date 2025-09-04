// __mocks__/handlers/userUpdateEmail.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import { parseBody, createTRPCErrorResponse, verifyJWT } from "../utils";

const updateEmailInputSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const userUpdateEmailHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/user.updateEmail",
  async ({ request }) => {
    console.log("user.updateEmail handler called");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return createTRPCErrorResponse(
        0,
        "Unauthorized: User must be logged in",
        -32001,
        401,
        "user.updateEmail"
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
        "user.updateEmail"
      );
    }
    const { userId } = decoded;
    console.log("Decoded userId:", userId);

    let body: { email: string };
    try {
      body = await parseBody(
        request,
        updateEmailInputSchema,
        "user.updateEmail"
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
        "user.updateEmail"
      );
    }

    const { email } = body;

    if (email === "existing@example.com") {
      console.error("Email already in use:", email);
      return createTRPCErrorResponse(
        0,
        "Email already in use",
        -32602,
        400,
        "user.updateEmail"
      );
    }

    if (userId === "test-user-id" && email === "newemail@example.com") {
      console.log(
        "Returning success response for userId:",
        userId,
        "and email:",
        email
      );
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: { message: "Email updated successfully", email },
          },
        },
        { status: 200 }
      );
    }

    console.error("User not found for userId:", userId);
    return createTRPCErrorResponse(
      0,
      "User not found",
      -32001,
      404,
      "user.updateEmail"
    );
  }
);
