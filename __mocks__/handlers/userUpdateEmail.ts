import { http, HttpResponse } from "msw";
import { z } from "zod";
import { verifyJWT, createTRPCErrorResponse, withBodyParsing } from "../utils";

const updateEmailInputSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const userUpdateEmailHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/user.updateEmail",
  withBodyParsing(
    updateEmailInputSchema,
    "user.updateEmail",
    async (body, request) => {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
        return createTRPCErrorResponse(
          0,
          "Invalid token",
          -32001,
          401,
          "user.updateEmail"
        );
      }
      const { userId } = decoded;

      const { email } = body;

      if (email === "existing@example.com") {
        return createTRPCErrorResponse(
          0,
          "Email already in use",
          -32602,
          400,
          "user.updateEmail"
        );
      }

      if (userId === "test-user-id" && email === "newemail@example.com") {
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

      return createTRPCErrorResponse(
        0,
        "User not found",
        -32001,
        404,
        "user.updateEmail"
      );
    }
  )
);
