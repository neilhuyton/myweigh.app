// server/routers/user.ts
import { t } from "../trpc-base";
import { z } from "zod";
import { sendEmailChangeNotification } from "../email";

export const userRouter = t.router({
  updateEmail: t.procedure
    .input(
      z.object({
        email: z.string().email({ message: "Invalid email address" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email } = input;
      const userId = ctx.userId;

      if (!userId) {
        throw new Error("Unauthorized: User must be logged in", {
          cause: {
            code: "UNAUTHORIZED",
            httpStatus: 401,
            path: "user.updateEmail",
          },
        });
      }

      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!currentUser) {
        throw new Error("User not found", {
          cause: {
            code: "NOT_FOUND",
            httpStatus: 404,
            path: "user.updateEmail",
          },
        });
      }

      const oldEmail = currentUser.email;

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error("Email already in use", {
          cause: {
            code: "BAD_REQUEST",
            httpStatus: 400,
            path: "user.updateEmail",
          },
        });
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: { email },
      });

      if (oldEmail !== email) {
        const emailResult = await sendEmailChangeNotification(oldEmail, email);
        if (!emailResult.success) {
          // Note: Don't throw an error to avoid reverting the email update
        }
      }

      return {
        message: "Email updated successfully",
        email: updatedUser.email,
      };
    }),
  updateFirstLogin: t.procedure
    .input(
      z.object({
        isFirstLogin: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { isFirstLogin } = input;
      const userId = ctx.userId;

      if (!userId) {
        throw new Error("Unauthorized: User must be logged in", {
          cause: {
            code: "UNAUTHORIZED",
            httpStatus: 401,
            path: "user.updateFirstLogin",
          },
        });
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: { isFirstLogin },
      });

      return {
        message: "First login status updated successfully",
        isFirstLogin: updatedUser.isFirstLogin,
      };
    }),
});
