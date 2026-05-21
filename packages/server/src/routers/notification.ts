import { z } from 'zod';
import { eq, or, isNull, desc, and } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import { notifications } from '../schema.js';

export const notificationRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    db
      .select()
      .from(notifications)
      .where(or(isNull(notifications.userId), eq(notifications.userId, ctx.user.id)))
      .orderBy(desc(notifications.id))
      .limit(50)
      .all(),
  ),

  unreadCount: protectedProcedure.query(({ ctx }) => {
    const rows = db
      .select()
      .from(notifications)
      .where(
        and(
          or(isNull(notifications.userId), eq(notifications.userId, ctx.user.id)),
          eq(notifications.read, false),
        ),
      )
      .all();
    return rows.length;
  }),

  markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.update(notifications).set({ read: true }).where(eq(notifications.id, input.id)).run();
    return { ok: true };
  }),

  markAllRead: protectedProcedure.mutation(({ ctx }) => {
    db.update(notifications)
      .set({ read: true })
      .where(or(isNull(notifications.userId), eq(notifications.userId, ctx.user.id)))
      .run();
    return { ok: true };
  }),
});
