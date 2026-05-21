import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import {
  procurements,
  procurementItems,
  procurementQuotes,
  projects,
  suppliers,
} from '../schema.js';
import { PROCUREMENT_STATUSES, PAYMENT_METHODS } from '@pangcheng/shared';

const itemInput = z.object({
  name: z.string().min(1),
  spec: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  quantity: z.number().default(0),
  unitPrice: z.number().default(0),
  note: z.string().optional().nullable(),
});

const procurementInput = z.object({
  title: z.string().min(1, '請輸入採購標題'),
  projectId: z.number().nullable().optional(),
  supplierId: z.number().nullable().optional(),
  status: z.enum(PROCUREMENT_STATUSES).default('draft'),
  paymentMethod: z.enum(PAYMENT_METHODS).default('bank_transfer'),
  requestedBy: z.string().optional().nullable(),
  requestDate: z.string().optional().nullable(),
  expectedDate: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  items: z.array(itemInput).default([]),
});

function genCode(): string {
  const year = new Date().getFullYear();
  const row = db.select({ c: sql<number>`count(*)` }).from(procurements).get();
  const seq = (row?.c ?? 0) + 1;
  return `PO${year}-${String(seq).padStart(4, '0')}`;
}

function writeItems(procurementId: number, items: z.infer<typeof itemInput>[]): number {
  db.delete(procurementItems).where(eq(procurementItems.procurementId, procurementId)).run();
  let total = 0;
  for (const it of items) {
    const amount = it.quantity * it.unitPrice;
    total += amount;
    db.insert(procurementItems)
      .values({ ...it, procurementId, amount })
      .run();
  }
  return total;
}

export const procurementRouter = router({
  list: protectedProcedure.query(() =>
    db
      .select({
        id: procurements.id,
        code: procurements.code,
        title: procurements.title,
        status: procurements.status,
        paymentMethod: procurements.paymentMethod,
        totalAmount: procurements.totalAmount,
        requestDate: procurements.requestDate,
        expectedDate: procurements.expectedDate,
        projectId: procurements.projectId,
        projectName: projects.name,
        supplierId: procurements.supplierId,
        supplierName: suppliers.name,
      })
      .from(procurements)
      .leftJoin(projects, eq(procurements.projectId, projects.id))
      .leftJoin(suppliers, eq(procurements.supplierId, suppliers.id))
      .orderBy(desc(procurements.id))
      .all(),
  ),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
    const p = db.select().from(procurements).where(eq(procurements.id, input.id)).get();
    if (!p) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到採購單' });
    const items = db
      .select()
      .from(procurementItems)
      .where(eq(procurementItems.procurementId, input.id))
      .all();
    const quotes = db
      .select()
      .from(procurementQuotes)
      .where(eq(procurementQuotes.procurementId, input.id))
      .all();
    const project = p.projectId
      ? db.select().from(projects).where(eq(projects.id, p.projectId)).get()
      : null;
    const supplier = p.supplierId
      ? db.select().from(suppliers).where(eq(suppliers.id, p.supplierId)).get()
      : null;
    return {
      ...p,
      items,
      quotes,
      projectName: project?.name ?? null,
      supplierName: supplier?.name ?? null,
    };
  }),

  create: protectedProcedure.input(procurementInput).mutation(({ input, ctx }) => {
    const { items, ...data } = input;
    const created = db
      .insert(procurements)
      .values({
        ...data,
        code: genCode(),
        requestedBy: data.requestedBy || ctx.user.name,
        totalAmount: 0,
      })
      .returning()
      .get();
    const total = writeItems(created.id, items);
    db.update(procurements)
      .set({ totalAmount: total })
      .where(eq(procurements.id, created.id))
      .run();
    return { ...created, totalAmount: total };
  }),

  update: protectedProcedure
    .input(procurementInput.extend({ id: z.number() }))
    .mutation(({ input }) => {
      const { id, items, ...data } = input;
      const total = writeItems(id, items);
      db.update(procurements)
        .set({ ...data, totalAmount: total })
        .where(eq(procurements.id, id))
        .run();
      return { ok: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(PROCUREMENT_STATUSES) }))
    .mutation(({ input }) => {
      const patch: Record<string, unknown> = { status: input.status };
      if (input.status === 'received') patch.receivedDate = new Date().toISOString().slice(0, 10);
      db.update(procurements).set(patch).where(eq(procurements.id, input.id)).run();
      return { ok: true };
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.delete(procurementItems).where(eq(procurementItems.procurementId, input.id)).run();
    db.delete(procurementQuotes).where(eq(procurementQuotes.procurementId, input.id)).run();
    db.delete(procurements).where(eq(procurements.id, input.id)).run();
    return { ok: true };
  }),

  // 廠商比價
  addQuote: protectedProcedure
    .input(
      z.object({
        procurementId: z.number(),
        supplierId: z.number().nullable().optional(),
        supplierName: z.string().min(1),
        quoteAmount: z.number().default(0),
        quoteDate: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
      }),
    )
    .mutation(({ input }) => db.insert(procurementQuotes).values(input).returning().get()),

  selectQuote: protectedProcedure
    .input(z.object({ id: z.number(), procurementId: z.number() }))
    .mutation(({ input }) => {
      db.update(procurementQuotes)
        .set({ selected: false })
        .where(eq(procurementQuotes.procurementId, input.procurementId))
        .run();
      db.update(procurementQuotes)
        .set({ selected: true })
        .where(eq(procurementQuotes.id, input.id))
        .run();
      const quote = db
        .select()
        .from(procurementQuotes)
        .where(eq(procurementQuotes.id, input.id))
        .get();
      if (quote?.supplierId) {
        db.update(procurements)
          .set({ supplierId: quote.supplierId })
          .where(eq(procurements.id, input.procurementId))
          .run();
      }
      return { ok: true };
    }),

  deleteQuote: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.delete(procurementQuotes).where(eq(procurementQuotes.id, input.id)).run();
    return { ok: true };
  }),
});
