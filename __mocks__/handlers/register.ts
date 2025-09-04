// __mocks__/handlers/register.ts
import { http, HttpResponse } from "msw";
import { z } from "zod";
import { parseBody, createTRPCErrorResponse } from "../utils";
import { mockUsers, type MockUser } from "../mockUsers";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const registerInputSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

export const registerHandler = http.post(
  "http://localhost:8888/.netlify/functions/trpc/register",
  async ({ request }) => {
    console.log("register handler called");

    let body: { email: string; password: string };
    try {
      body = await parseBody(request, registerInputSchema, "register");
      console.log("Parsed body:", JSON.stringify(body));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error parsing request body";
      console.error(message);
      return createTRPCErrorResponse(0, message, -32600, 400, "register");
    }

    const { email, password } = body;

    if (mockUsers.find((u: MockUser) => u.email === email)) {
      console.error("Email already exists:", email);
      return createTRPCErrorResponse(
        0,
        "Email already exists",
        -32602,
        400,
        "register"
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: MockUser = {
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      verificationToken: crypto.randomUUID(),
      isEmailVerified: false,
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      refreshToken: null,
    };
    mockUsers.push(newUser);
    console.log("Registered new user:", newUser.id, "with email:", email);

    return HttpResponse.json(
      {
        id: 0,
        result: {
          type: "data",
          data: {
            id: newUser.id,
            email: newUser.email,
            message:
              "Registration successful! Please check your email to verify your account.",
          },
        },
      },
      { status: 200 }
    );
  }
);
