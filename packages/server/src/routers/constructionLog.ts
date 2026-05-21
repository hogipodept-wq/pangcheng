import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import { constructionLogs, inspectionPhotos, projects } from '../schema.js';
import { WEATHER_TYPES, INSPECTION_RESULTS, LOG_STATUSES } from '@pangcheng/shared';

const workItem = z.object({
  name: z.string(),
  location: z.string().optional().default(''),
  quantity: z.string().optional().default(''),
  unit: z.string().optional().default(''),
  note: z.string().optional().default(''),
});
const laborItem = z.object({
  trade: z.string(),
  count: z.number().default(0),
  note: z.string().optional().default(''),
});
const equipmentItem = z.object({
  name: z.string(),
  count: z.number().default(0),
  hours: z.string().optional().default(''),
  note: z.string().optional().default(''),
});
const materialItem = z.object({
  name: z.string(),
  spec: z.string().optional().default(''),
  quantity: z.string().optional().default(''),
  unit: z.string().optional().default(''),
  supplier: z.string().optional().default(''),
  note: z.string().optional().default(''),
});
const inspectionItem = z.object({
  category: z.string().optional().default(''),
  item: z.string(),
  location: z.string().optional().default(''),
  result: z.enum(INSPECTION_RESULTS).default('pass'),
  inspector: z.string().optional().default(''),
  note: z.string().optional().default(''),
});

const logInput = z.object({
  projectId: z.number(),
  date: z.string().min(1, '請選擇日期'),
  weather: z.enum(WEATHER_TYPES).default('sunny'),
  temperature: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  coordinationNotes: z.string().optional().nullable(),
  safetyNotes: z.string().optional().nullable(),
  status: z.enum(LOG_STATUSES).default('submitted'),
  items: z.array(workItem).default([]),
  labor: z.array(laborItem).default([]),
  equipment: z.array(equipmentItem).default([]),
  materials: z.array(materialItem).default([]),
  inspections: z.array(inspectionItem).default([]),
});

type LogInput = z.infer<typeof logInput>;

function parseArr<T>(json: string | null): T[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json) as unknown;
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

function buildColumns(input: Omit<LogInput, 'projectId'> & { projectId?: number }) {
  const workforce = input.labor.reduce((s, l) => s + (Number(l.count) || 0), 0);
  return {
    date: input.date,
    weather: input.weather,
    temperature: input.temperature,
    summary: input.summary,
    content: input.content,
    coordinationNotes: input.coordinationNotes,
    safetyNotes: input.safetyNotes,
    status: input.status,
    workforce,
    itemsJson: JSON.stringify(input.items),
    laborJson: JSON.stringify(input.labor),
    equipmentJson: JSON.stringify(input.equipment),
    materialsJson: JSON.stringify(input.materials),
    inspectionsJson: JSON.stringify(input.inspections),
  };
}

export const constructionLogRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number().optional() }).optional())
    .query(({ input }) => {
      const rows = db
        .select({
          id: constructionLogs.id,
          projectId: constructionLogs.projectId,
          date: constructionLogs.date,
          weather: constructionLogs.weather,
          temperature: constructionLogs.temperature,
          workforce: constructionLogs.workforce,
          summary: constructionLogs.summary,
          status: constructionLogs.status,
          recordedBy: constructionLogs.recordedBy,
          projectName: projects.name,
        })
        .from(constructionLogs)
        .leftJoin(projects, eq(constructionLogs.projectId, projects.id))
        .orderBy(desc(constructionLogs.date))
        .all();
      return input?.projectId ? rows.filter((r) => r.projectId === input.projectId) : rows;
    }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
    const log = db
      .select()
      .from(constructionLogs)
      .where(eq(constructionLogs.id, input.id))
      .get();
    if (!log) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到施工日誌' });
    const project = db.select().from(projects).where(eq(projects.id, log.projectId)).get();
    const photos = db
      .select()
      .from(inspectionPhotos)
      .where(eq(inspectionPhotos.constructionLogId, input.id))
      .all();
    return {
      ...log,
      projectName: project?.name ?? null,
      items: parseArr<z.infer<typeof workItem>>(log.itemsJson),
      labor: parseArr<z.infer<typeof laborItem>>(log.laborJson),
      equipment: parseArr<z.infer<typeof equipmentItem>>(log.equipmentJson),
      materials: parseArr<z.infer<typeof materialItem>>(log.materialsJson),
      inspections: parseArr<z.infer<typeof inspectionItem>>(log.inspectionsJson),
      photos,
    };
  }),

  create: protectedProcedure.input(logInput).mutation(({ input, ctx }) =>
    db
      .insert(constructionLogs)
      .values({
        projectId: input.projectId,
        recordedBy: ctx.user.name,
        ...buildColumns(input),
      })
      .returning()
      .get(),
  ),

  update: protectedProcedure
    .input(logInput.extend({ id: z.number() }))
    .mutation(({ input }) => {
      db.update(constructionLogs)
        .set(buildColumns(input))
        .where(eq(constructionLogs.id, input.id))
        .run();
      return { ok: true };
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.update(inspectionPhotos)
      .set({ constructionLogId: null })
      .where(eq(inspectionPhotos.constructionLogId, input.id))
      .run();
    db.delete(constructionLogs).where(eq(constructionLogs.id, input.id)).run();
    return { ok: true };
  }),

  /** 自主檢查彙總（概自檢表用）：彙總所有日誌的自主檢查項目 */
  inspectionSummary: protectedProcedure.query(() => {
    const logs = db
      .select({
        id: constructionLogs.id,
        projectId: constructionLogs.projectId,
        date: constructionLogs.date,
        recordedBy: constructionLogs.recordedBy,
        inspectionsJson: constructionLogs.inspectionsJson,
        projectName: projects.name,
      })
      .from(constructionLogs)
      .leftJoin(projects, eq(constructionLogs.projectId, projects.id))
      .orderBy(desc(constructionLogs.date))
      .all();
    const records = logs.flatMap((l) =>
      parseArr<z.infer<typeof inspectionItem>>(l.inspectionsJson).map((ins, idx) => ({
        key: `${l.id}-${idx}`,
        logId: l.id,
        projectId: l.projectId,
        projectName: l.projectName,
        date: l.date,
        recordedBy: l.recordedBy,
        ...ins,
      })),
    );
    const photoCount = db.select().from(inspectionPhotos).all().length;
    return { records, photoCount };
  }),
});
