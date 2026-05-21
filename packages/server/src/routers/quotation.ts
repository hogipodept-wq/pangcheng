import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import { quotations, quotationItems, clients } from '../schema.js';
import { QUOTATION_STATUSES } from '@pangcheng/shared';

const itemInput = z.object({
  category: z.string().optional().nullable(),
  itemNo: z.string().optional().nullable(),
  name: z.string().min(1),
  spec: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  quantity: z.number().default(0),
  unitPrice: z.number().default(0),
  note: z.string().optional().nullable(),
});

const quotationInput = z.object({
  projectName: z.string().min(1, '請輸入報價名稱'),
  description: z.string().optional().nullable(),
  status: z.enum(QUOTATION_STATUSES).default('draft'),
  quoteDate: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  clientId: z.number().nullable().optional(),
  clientName: z.string().optional().nullable(),
  clientContact: z.string().optional().nullable(),
  clientPhone: z.string().optional().nullable(),
  clientEmail: z.string().optional().nullable(),
  clientAddress: z.string().optional().nullable(),
  discountPercent: z.number().default(0),
  taxRate: z.number().default(5),
  paymentTerms: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  items: z.array(itemInput).default([]),
});

function genCode(): string {
  const year = new Date().getFullYear();
  const row = db.select({ c: sql<number>`count(*)` }).from(quotations).get();
  const seq = (row?.c ?? 0) + 1;
  return `Q${year}-${String(seq).padStart(3, '0')}`;
}

function computeTotals(
  items: z.infer<typeof itemInput>[],
  discountPercent: number,
  taxRate: number,
) {
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxBase = subtotal - discountAmount;
  const taxAmount = Math.round((taxBase * taxRate) / 100);
  const totalAmount = taxBase + taxAmount;
  return { subtotal, discountAmount, taxAmount, totalAmount };
}

function writeItems(quotationId: number, items: z.infer<typeof itemInput>[]) {
  db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId)).run();
  for (const it of items) {
    db.insert(quotationItems)
      .values({ ...it, quotationId, amount: it.quantity * it.unitPrice })
      .run();
  }
}

export const quotationRouter = router({
  list: protectedProcedure.query(() =>
    db
      .select({
        id: quotations.id,
        code: quotations.code,
        projectName: quotations.projectName,
        clientName: quotations.clientName,
        status: quotations.status,
        quoteDate: quotations.quoteDate,
        validUntil: quotations.validUntil,
        totalAmount: quotations.totalAmount,
        createdBy: quotations.createdBy,
      })
      .from(quotations)
      .orderBy(desc(quotations.id))
      .all(),
  ),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
    const q = db.select().from(quotations).where(eq(quotations.id, input.id)).get();
    if (!q) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到報價單' });
    const items = db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, input.id))
      .all();
    return { ...q, items };
  }),

  create: protectedProcedure.input(quotationInput).mutation(({ input, ctx }) => {
    const { items, ...data } = input;
    const totals = computeTotals(items, data.discountPercent, data.taxRate);
    const created = db
      .insert(quotations)
      .values({ ...data, ...totals, code: genCode(), createdBy: ctx.user.name })
      .returning()
      .get();
    writeItems(created.id, items);
    return created;
  }),

  update: protectedProcedure
    .input(quotationInput.extend({ id: z.number() }))
    .mutation(({ input }) => {
      const { id, items, ...data } = input;
      const totals = computeTotals(items, data.discountPercent, data.taxRate);
      db.update(quotations)
        .set({ ...data, ...totals })
        .where(eq(quotations.id, id))
        .run();
      writeItems(id, items);
      return { ok: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(QUOTATION_STATUSES) }))
    .mutation(({ input }) => {
      db.update(quotations)
        .set({ status: input.status })
        .where(eq(quotations.id, input.id))
        .run();
      return { ok: true };
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.delete(quotationItems).where(eq(quotationItems.quotationId, input.id)).run();
    db.delete(quotations).where(eq(quotations.id, input.id)).run();
    return { ok: true };
  }),

  /** 供表單帶入客戶資料庫的清單 */
  clientOptions: protectedProcedure.query(() =>
    db
      .select({
        id: clients.id,
        name: clients.name,
        taxId: clients.taxId,
        phone: clients.phone,
        email: clients.email,
        address: clients.address,
      })
      .from(clients)
      .all(),
  ),
});
