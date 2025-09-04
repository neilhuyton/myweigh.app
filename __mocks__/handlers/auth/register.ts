import { http, HttpResponse } from "msw";
import { z } from "zod";
import { createTRPCErrorResponse, withBodyParsing } from "../../utils";
import { mockUsers, type MockUser } from "../../mockUsers";
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
  withBodyParsing(registerInputSchema, "register", async (body) => {
    const { email, password } = body;

    if (mockUsers.find((u: MockUser) => u.email === email)) {
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
  })
);
