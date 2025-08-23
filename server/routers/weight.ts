import { t } from '../trpc-base';
import { z } from 'zod';

export const weightRouter = t.router({
  create: t.procedure
    .input(
      z.object({
        weightKg: z
          .number()
          .positive({ message: 'Weight must be a positive number' }),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new Error('Unauthorized: User must be logged in');
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
      throw new Error('Unauthorized: User must be logged in');
    }

    return ctx.prisma.weightMeasurement.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
    });
  }),
  delete: t.procedure
    .input(
      z.object({
        weightId: z.string().uuid({ message: 'Invalid weight ID' }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new Error('Unauthorized: User must be logged in');
      }

      const weight = await ctx.prisma.weightMeasurement.findUnique({
        where: { id: input.weightId },
      });

      if (!weight) {
        throw new Error('Weight measurement not found');
      }

      if (weight.userId !== ctx.userId) {
        throw new Error(
          'Unauthorized: Cannot delete another user\'s weight measurement'
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
          .positive({ message: 'Goal weight must be a positive number' }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new Error('Unauthorized: User must be logged in');
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
      throw new Error('Unauthorized: User must be logged in');
    }

    const goal = await ctx.prisma.goal.findUnique({
      where: { userId: ctx.userId },
    });

    if (!goal) {
      return null;
    }

    return { goalWeightKg: goal.goalWeightKg };
  }),
});