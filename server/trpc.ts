import { initTRPC } from "@trpc/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "./email";

const t = initTRPC
  .context<{ prisma: PrismaClient; userId?: string }>()
  .create();

export const appRouter = t.router({
  getUsers: t.procedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany();
  }),
  register: t.procedure
    .input(
      z.object({
        email: z.string().email({ message: "Invalid email address" }),
        password: z
          .string()
          .min(8, { message: "Password must be at least 8 characters" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("Email already registered");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomUUID();

      const user = await ctx.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          verificationToken,
          isEmailVerified: false,
        },
      });

      const emailResult = await sendVerificationEmail(email, verificationToken);
      if (!emailResult.success) {
        throw new Error("Failed to send verification email");
      }

      return {
        id: user.id,
        email: user.email,
        message:
          "Registration successful! Please check your email to verify your account.",
      };
    }),
  login: t.procedure
    .input(
      z.object({
        email: z.string().email({ message: "Invalid email address" }),
        password: z
          .string()
          .min(8, { message: "Password must be at least 8 characters" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      const user = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("Invalid email or password");
      }

      if (!user.isEmailVerified) {
        throw new Error("Please verify your email before logging in");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      return { id: user.id, email: user.email };
    }),
  verifyEmail: t.procedure
  .input(
    z.object({
      token: z.string().uuid({ message: "Invalid verification token" }),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { token } = input;

    const user = await ctx.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      // Check if the user exists and is already verified
      const existingUser = await ctx.prisma.user.findFirst({
        where: { verificationToken: null, isEmailVerified: true },
        select: { email: true },
      });
      if (existingUser) {
        throw new Error("Email already verified");
      }
      throw new Error("Invalid verification token");
    }

    if (user.isEmailVerified) {
      throw new Error("Email already verified");
    }

    await ctx.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });

    return {
      message: "Email verified successfully!",
    };
  }),
  weight: t.router({
    create: t.procedure
      .input(
        z.object({
          weightKg: z
            .number()
            .positive({ message: "Weight must be a positive number" }),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.userId) {
          throw new Error("Unauthorized: User must be logged in");
        }

        const weight = await ctx.prisma.weightMeasurement.create({
          data: {
            userId: ctx.userId,
            weightKg: input.weightKg,
            note: input.note,
            createdAt: new Date(),
          },
        });

        return {
          id: weight.id,
          weightKg: weight.weightKg,
          createdAt: weight.createdAt,
        };
      }),
    getWeights: t.procedure.query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new Error("Unauthorized: User must be logged in");
      }

      return ctx.prisma.weightMeasurement.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: "desc" },
      });
    }),
    delete: t.procedure
      .input(
        z.object({
          weightId: z.string().uuid({ message: "Invalid weight ID" }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.userId) {
          throw new Error("Unauthorized: User must be logged in");
        }

        const weight = await ctx.prisma.weightMeasurement.findUnique({
          where: { id: input.weightId },
        });

        if (!weight) {
          throw new Error("Weight measurement not found");
        }

        if (weight.userId !== ctx.userId) {
          throw new Error(
            "Unauthorized: Cannot delete another user's weight measurement"
          );
        }

        await ctx.prisma.weightMeasurement.delete({
          where: { id: input.weightId },
        });

        return { id: input.weightId };
      }),
    setGoal: t.procedure
      .input(
        z.object({
          goalWeightKg: z
            .number()
            .positive({ message: "Goal weight must be a positive number" }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.userId) {
          throw new Error("Unauthorized: User must be logged in");
        }

        const goal = await ctx.prisma.goal.upsert({
          where: { userId: ctx.userId },
          update: { goalWeightKg: input.goalWeightKg },
          create: {
            userId: ctx.userId,
            goalWeightKg: input.goalWeightKg,
            startWeightKg: 0,
          },
        });

        return { goalWeightKg: goal.goalWeightKg };
      }),
    getGoal: t.procedure.query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new Error("Unauthorized: User must be logged in");
      }

      const goal = await ctx.prisma.goal.findUnique({
        where: { userId: ctx.userId },
      });

      if (!goal) {
        return null;
      }

      return { goalWeightKg: goal.goalWeightKg };
    }),
  }),
});

export type AppRouter = typeof appRouter;
