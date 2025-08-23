import { t } from '../trpc-base';

export const userRouter = t.router({
  getUsers: t.procedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany();
  }),
});