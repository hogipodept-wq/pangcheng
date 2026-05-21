import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import {
  projects,
  clients,
  projectPersonnel,
  projectBidItems,
  projectTasks,
  procurements,
} from '../schema.js';
import { PROJECT_STATUSES, PERSONNEL_ROLES, TASK_STATUSES } from '@pangcheng/shared';

const projectInput = z.object({
  name: z.string().min(1, '請輸入專案名稱'),
  clientId: z.number().nullable().optional(),
  status: z.enum(PROJECT_STATUSES).default('planning'),
  address: z.string().optional().nullable(),
  manager: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  contractAmount: z.number().default(0),
  budgetAmount: z.number().default(0),
  description: z.string().optional().nullable(),
});

function genProjectCode(): string {
  const year = new Date().getFullYear();
  const row = db.select({ c: sql<number>`count(*)` }).from(projects).get();
  const seq = (row?.c ?? 0) + 1;
  return `P${year}-${String(seq).padStart(3, '0')}`;
}

export const projectRouter = router({
  list: protectedProcedure.query(() => {
    const rows = db
      .select({
        id: projects.id,
        code: projects.code,
        name: projects.name,
        clientId: projects.clientId,
        status: projects.status,
        manager: projects.manager,
        startDate: projects.startDate,
        endDate: projects.endDate,
        contractAmount: projects.contractAmount,
        budgetAmount: projects.budgetAmount,
        clientName: clients.name,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .orderBy(desc(projects.id))
      .all();
    return rows;
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
    const project = db.select().from(projects).where(eq(projects.id, input.id)).get();
    if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到專案' });
    const client = project.clientId
      ? db.select().from(clients).where(eq(clients.id, project.clientId)).get()
      : null;
    const personnel = db
      .select()
      .from(projectPersonnel)
      .where(eq(projectPersonnel.projectId, input.id))
      .all();
    const bidItems = db
      .select()
      .from(projectBidItems)
      .where(eq(projectBidItems.projectId, input.id))
      .all();
    const tasks = db
      .select()
      .from(projectTasks)
      .where(eq(projectTasks.projectId, input.id))
      .orderBy(projectTasks.sortOrder)
      .all();
    const relatedProcurements = db
      .select()
      .from(procurements)
      .where(eq(procurements.projectId, input.id))
      .all();
    const spent = relatedProcurements.reduce((s, p) => s + (p.totalAmount ?? 0), 0);
    return {
      ...project,
      clientName: client?.name ?? null,
      personnel,
      bidItems,
      tasks,
      procurements: relatedProcurements,
      spent,
    };
  }),

  create: protectedProcedure.input(projectInput).mutation(({ input }) =>
    db
      .insert(projects)
      .values({ ...input, code: genProjectCode() })
      .returning()
      .get(),
  ),

  update: protectedProcedure
    .input(projectInput.extend({ id: z.number() }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      db.update(projects).set(data).where(eq(projects.id, id)).run();
      return { ok: true };
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.delete(projectPersonnel).where(eq(projectPersonnel.projectId, input.id)).run();
    db.delete(projectBidItems).where(eq(projectBidItems.projectId, input.id)).run();
    db.delete(projectTasks).where(eq(projectTasks.projectId, input.id)).run();
    db.delete(projects).where(eq(projects.id, input.id)).run();
    return { ok: true };
  }),

  // 專案人員
  addPersonnel: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string().min(1),
        role: z.enum(PERSONNEL_ROLES).default('engineer'),
        phone: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
      }),
    )
    .mutation(({ input }) => db.insert(projectPersonnel).values(input).returning().get()),

  deletePersonnel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.delete(projectPersonnel).where(eq(projectPersonnel.id, input.id)).run();
      return { ok: true };
    }),

  // 標單項目
  addBidItem: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        itemNo: z.string().optional().nullable(),
        name: z.string().min(1),
        spec: z.string().optional().nullable(),
        unit: z.string().optional().nullable(),
        quantity: z.number().default(0),
        unitPrice: z.number().default(0),
        note: z.string().optional().nullable(),
      }),
    )
    .mutation(({ input }) =>
      db
        .insert(projectBidItems)
        .values({ ...input, amount: input.quantity * input.unitPrice })
        .returning()
        .get(),
    ),

  deleteBidItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.delete(projectBidItems).where(eq(projectBidItems.id, input.id)).run();
      return { ok: true };
    }),

  // 任務
  saveTask: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        projectId: z.number(),
        name: z.string().min(1),
        status: z.enum(TASK_STATUSES).default('todo'),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        progress: z.number().min(0).max(100).default(0),
        assignee: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      if (id) {
        db.update(projectTasks).set(data).where(eq(projectTasks.id, id)).run();
        return { ok: true, id };
      }
      const created = db.insert(projectTasks).values(data).returning().get();
      return { ok: true, id: created.id };
    }),

  deleteTask: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.delete(projectTasks).where(eq(projectTasks.id, input.id)).run();
    return { ok: true };
  }),
});
