import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import { users } from '../schema.js';
import { hashPassword, verifyPassword, signToken } from '../auth.js';
import { TRPCError } from '@trpc/server';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

function publicUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
  };
}

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => (ctx.user ? publicUser(ctx.user) : null)),

  login: publicProcedure
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(({ input, ctx }) => {
      const user = db.select().from(users).where(eq(users.username, input.username)).get();
      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '帳號或密碼錯誤' });
      }
      if (!user.active) {
        throw new TRPCError({ code: 'FORBIDDEN', message: '此帳號已停用' });
      }
      const token = signToken({ id: user.id, username: user.username, role: user.role });
      ctx.res.cookie('token', token, COOKIE_OPTS);
      return publicUser(user);
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie('token', { path: '/' });
    return { ok: true };
  }),

  changePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6) }))
    .mutation(({ input, ctx }) => {
      const user = db.select().from(users).where(eq(users.id, ctx.user.id)).get();
      if (!user || !verifyPassword(input.currentPassword, user.passwordHash)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '目前密碼錯誤' });
      }
      db.update(users)
        .set({ passwordHash: hashPassword(input.newPassword) })
        .where(eq(users.id, ctx.user.id))
        .run();
      return { ok: true };
    }),
});
