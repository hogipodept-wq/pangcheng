import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import { suppliers, supplierFiles } from '../schema.js';
import { TRADE_CATEGORIES, SUPPLIER_FILE_TYPES } from '@pangcheng/shared';

const supplierInput = z.object({
  name: z.string().min(1, '請輸入廠商名稱'),
  taxId: z.string().optional().nullable(),
  tradeCategory: z.enum(TRADE_CATEGORIES).default('other'),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).default(0),
  note: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

const fileInput = z.object({
  supplierId: z.number(),
  fileType: z.enum(SUPPLIER_FILE_TYPES).default('other'),
  name: z.string().min(1),
  fileUrl: z.string().min(1),
  expiryDate: z.string().optional().nullable(),
});

export const supplierRouter = router({
  list: protectedProcedure.query(() =>
    db.select().from(suppliers).orderBy(desc(suppliers.id)).all(),
  ),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
    const supplier = db.select().from(suppliers).where(eq(suppliers.id, input.id)).get();
    if (!supplier) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到廠商資料' });
    const files = db
      .select()
      .from(supplierFiles)
      .where(eq(supplierFiles.supplierId, input.id))
      .all();
    return { ...supplier, files };
  }),

  create: protectedProcedure.input(supplierInput).mutation(({ input }) =>
    db.insert(suppliers).values(input).returning().get(),
  ),

  update: protectedProcedure
    .input(supplierInput.extend({ id: z.number() }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      db.update(suppliers).set(data).where(eq(suppliers.id, id)).run();
      return { ok: true };
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.delete(supplierFiles).where(eq(supplierFiles.supplierId, input.id)).run();
    db.delete(suppliers).where(eq(suppliers.id, input.id)).run();
    return { ok: true };
  }),

  addFile: protectedProcedure.input(fileInput).mutation(({ input }) =>
    db.insert(supplierFiles).values(input).returning().get(),
  ),

  deleteFile: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.delete(supplierFiles).where(eq(supplierFiles.id, input.id)).run();
    return { ok: true };
  }),
});
