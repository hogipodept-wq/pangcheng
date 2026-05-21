import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import { staff } from '../schema.js';

const staffInput = z.object({
  name: z.string().min(1, '請輸入姓名'),
  role: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  dailyWage: z.number().default(0),
  note: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const staffRouter = router({
  list: protectedProcedure.query(() => db.select().from(staff).orderBy(desc(staff.id)).all()),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
    const found = db.select().from(staff).where(eq(staff.id, input.id)).get();
    if (!found) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到人員資料' });
    return found;
  }),

  create: protectedProcedure.input(staffInput).mutation(({ input }) =>
    db.insert(staff).values(input).returning().get(),
  ),

  update: protectedProcedure
    .input(staffInput.extend({ id: z.number() }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      db.update(staff).set(data).where(eq(staff.id, id)).run();
      return { ok: true };
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.delete(staff).where(eq(staff.id, input.id)).run();
    return { ok: true };
  }),
});
