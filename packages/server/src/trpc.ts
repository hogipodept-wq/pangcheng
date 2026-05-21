import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import superjson from 'superjson';
import { eq } from 'drizzle-orm';
import { verifyToken } from './auth.js';
import { db } from './db.js';
import { users } from './schema.js';

export function createContext({ req, res }: CreateExpressContextOptions) {
  const token = (req.cookies?.token as string | undefined) ?? undefined;
  let user: typeof users.$inferSelect | null = null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const found = db.select().from(users).where(eq(users.id, payload.id)).get();
      if (found && found.active) user = found;
    }
  }
  return { req, res, user };
}

export type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '請先登入' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export function roleProcedure(...roles: string[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (ctx.user.role !== 'admin' && !roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '權限不足，無法執行此操作' });
    }
    return next();
  });
}
