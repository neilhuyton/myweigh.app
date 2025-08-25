// server/routers/user.ts
import { t } from '../trpc-base';
import { z } from 'zod';
import { sendEmailChangeNotification } from '../email';

export const userRouter = t.router({
  updateEmail: t.procedure
    .input(
      z.object({
        email: z.string().email({ message: 'Invalid email address' }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email } = input;
      const userId = ctx.userId;

      if (!userId) {
        throw new Error('Unauthorized: User must be logged in');
      }

      // Fetch the current user to get the old email
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      const oldEmail = currentUser.email;

      // Check if email is already in use by another user
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already in use');
      }

      // Update the user's email
      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: { email },
      });

      // Send notification to the old email if it has changed
      if (oldEmail !== email) {
        const emailResult = await sendEmailChangeNotification(oldEmail, email);
        if (!emailResult.success) {
          console.warn(`Failed to send email change notification to ${oldEmail}: ${emailResult.error}`);
          // Note: Don't throw an error to avoid reverting the email update
        }
      }

      return { message: 'Email updated successfully', email: updatedUser.email };
    }),
});