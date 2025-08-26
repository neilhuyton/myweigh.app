// server/routers/weight.ts
import { t } from "../trpc-base";
import { z } from "zod";

export const weightRouter = t.router({
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

      // Check if the new weight meets the current goal
      const currentGoal = await ctx.prisma.goal.findFirst({
        where: { userId: ctx.userId, reachedAt: null },
      });

      if (currentGoal) {
        const isGoalReached = input.weightKg <= currentGoal.goalWeightKg;
        if (isGoalReached) {
          await ctx.prisma.goal.update({
            where: { id: currentGoal.id },
            data: { reachedAt: new Date() },
          });
        }
      }

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

      // Check if there's an active (unreached) goal
      const currentGoal = await ctx.prisma.goal.findFirst({
        where: { userId: ctx.userId, reachedAt: null },
      });

      if (currentGoal) {
        throw new Error(
          "Cannot set a new goal until the current goal is reached or edited"
        );
      }

      const goal = await ctx.prisma.goal.create({
        data: {
          userId: ctx.userId,
          goalWeightKg: input.goalWeightKg,
          goalSetAt: new Date(),
        },
      });

      return {
        id: goal.id,
        goalWeightKg: goal.goalWeightKg,
        goalSetAt: goal.goalSetAt,
      };
    }),
  updateGoal: t.procedure
    .input(
      z.object({
        goalId: z.string().uuid({ message: "Invalid goal ID" }),
        goalWeightKg: z
          .number()
          .positive({ message: "Goal weight must be a positive number" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new Error("Unauthorized: User must be logged in");
      }

      const goal = await ctx.prisma.goal.findUnique({
        where: { id: input.goalId },
      });

      if (!goal) {
        throw new Error("Goal not found");
      }

      if (goal.userId !== ctx.userId) {
        throw new Error("Unauthorized: Cannot edit another user's goal");
      }

      if (goal.reachedAt) {
        throw new Error("Cannot edit a goal that has already been reached");
      }

      const updatedGoal = await ctx.prisma.goal.update({
        where: { id: input.goalId },
        data: { goalWeightKg: input.goalWeightKg },
      });

      return {
        id: updatedGoal.id,
        goalWeightKg: updatedGoal.goalWeightKg,
        goalSetAt: updatedGoal.goalSetAt,
      };
    }),
  getCurrentGoal: t.procedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new Error("Unauthorized: User must be logged in");
    }

    const goal = await ctx.prisma.goal.findFirst({
      where: { userId: ctx.userId, reachedAt: null },
      orderBy: { goalSetAt: "desc" },
    });

    if (!goal) {
      return null;
    }

    return {
      id: goal.id,
      goalWeightKg: goal.goalWeightKg,
      goalSetAt: goal.goalSetAt,
    };
  }),
  getGoals: t.procedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new Error("Unauthorized: User must be logged in");
    }

    return ctx.prisma.goal.findMany({
      where: { userId: ctx.userId },
      orderBy: { goalSetAt: "desc" },
    });
  }),
});
