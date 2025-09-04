// server/routers/weight.ts
import { t } from "../trpc-base";
import { z } from "zod";

// Custom validator for up to two decimal places
const twoDecimalPlaces = z
  .number()
  .positive({ message: "Weight must be a positive number" })
  .refine(
    (val) => {
      const decimalPlaces = val.toString().split(".")[1]?.length || 0;
      return decimalPlaces <= 2;
    },
    {
      message: "Weight can have up to two decimal places",
    }
  );

export const weightRouter = t.router({
  create: t.procedure
    .input(
      z.object({
        weightKg: twoDecimalPlaces,
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
        weightKg: Number(input.weightKg.toFixed(2)), // Ensure two decimal places in response
        createdAt: weight.createdAt,
      };
    }),
  getWeights: t.procedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new Error("Unauthorized: User must be logged in");
    }

    const weights = await ctx.prisma.weightMeasurement.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "desc" },
    });

    // Format weights to two decimal places in response
    return weights.map((weight) => ({
      ...weight,
      weightKg: Number(weight.weightKg.toFixed(2)),
    }));
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
        goalWeightKg: twoDecimalPlaces,
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
        goalWeightKg: Number(input.goalWeightKg.toFixed(2)), // Ensure two decimal places in response
        goalSetAt: goal.goalSetAt,
      };
    }),
  updateGoal: t.procedure
    .input(
      z.object({
        goalId: z.string().uuid({ message: "Invalid goal ID" }),
        goalWeightKg: twoDecimalPlaces,
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
        goalWeightKg: Number(input.goalWeightKg.toFixed(2)), // Ensure two decimal places in response
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
      goalWeightKg: Number(goal.goalWeightKg.toFixed(2)), // Ensure two decimal places in response
      goalSetAt: goal.goalSetAt,
    };
  }),
  getGoals: t.procedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new Error("Unauthorized: User must be logged in");
    }

    const goals = await ctx.prisma.goal.findMany({
      where: { userId: ctx.userId },
      orderBy: { goalSetAt: "desc" },
    });

    // Format goals to two decimal places in response
    return goals.map((goal) => ({
      ...goal,
      goalWeightKg: Number(goal.goalWeightKg.toFixed(2)),
    }));
  }),
});
