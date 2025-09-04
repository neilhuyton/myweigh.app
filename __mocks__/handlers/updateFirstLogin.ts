// __mocks__/handlers/userUpdateFirstLogin.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import { parseBody, createTRPCErrorResponse, verifyJWT } from "../utils";

const updateFirstLoginInputSchema = z.object({
  isFirstLogin: z.boolean({ message: "isFirstLogin must be a boolean" }),
});

export const userUpdateFirstLoginHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/user.updateFirstLogin",
  async ({ request }) => {
    console.log("user.updateFirstLogin handler called");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return createTRPCErrorResponse(
        0,
        "Unauthorized: User must be logged in",
        -32001,
        401,
        "user.updateFirstLogin"
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
        "user.updateFirstLogin"
      );
    }
    const { userId } = decoded;
    console.log("Decoded userId:", userId);

    let body: { isFirstLogin: boolean };
    try {
      body = await parseBody(
        request,
        updateFirstLoginInputSchema,
        "user.updateFirstLogin"
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
        "user.updateFirstLogin"
      );
    }

    const { isFirstLogin } = body;

    if (userId === "test-user-id") {
      console.log(
        "Returning success response for userId:",
        userId,
        "isFirstLogin:",
        isFirstLogin
      );
      return HttpResponse.json(
        {
          id: 0,
          result: {
            type: "data",
            data: { message: "First login status updated successfully" },
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
      "user.updateFirstLogin"
    );
  }
);
