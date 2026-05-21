import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, roleProcedure } from '../trpc.js';
import { db } from '../db.js';
import { users } from '../schema.js';
import { hashPassword } from '../auth.js';
import { ROLES } from '@pangcheng/shared';

const adminOnly = roleProcedure('admin');

export const userRouter = router({
  list: adminOnly.query(() =>
    db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
      })
      .from(users)
      .all(),
  ),

  create: adminOnly
    .input(
      z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal('')),
        role: z.enum(ROLES),
      }),
    )
    .mutation(({ input }) => {
      const exists = db.select().from(users).where(eq(users.username, input.username)).get();
      if (exists) throw new TRPCError({ code: 'CONFLICT', message: '帳號已存在' });
      return db
        .insert(users)
        .values({
          username: input.username,
          passwordHash: hashPassword(input.password),
          name: input.name,
          email: input.email || null,
          role: input.role,
        })
        .returning()
        .get();
    }),

  update: adminOnly
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal('')),
        role: z.enum(ROLES),
        active: z.boolean(),
      }),
    )
    .mutation(({ input }) => {
      db.update(users)
        .set({ name: input.name, email: input.email || null, role: input.role, active: input.active })
        .where(eq(users.id, input.id))
        .run();
      return { ok: true };
    }),

  resetPassword: adminOnly
    .input(z.object({ id: z.number(), newPassword: z.string().min(6) }))
    .mutation(({ input }) => {
      db.update(users)
        .set({ passwordHash: hashPassword(input.newPassword) })
        .where(eq(users.id, input.id))
        .run();
      return { ok: true };
    }),

  delete: adminOnly.input(z.object({ id: z.number() })).mutation(({ input, ctx }) => {
    if (input.id === ctx.user.id) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '無法刪除自己的帳號' });
    }
    db.delete(users).where(eq(users.id, input.id)).run();
    return { ok: true };
  }),
});
