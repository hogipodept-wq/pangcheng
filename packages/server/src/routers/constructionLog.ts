import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import { constructionLogs, inspectionPhotos, projects } from '../schema.js';
import { WEATHER_TYPES } from '@pangcheng/shared';

const logInput = z.object({
  projectId: z.number(),
  date: z.string().min(1, '請選擇日期'),
  weather: z.enum(WEATHER_TYPES).default('sunny'),
  temperature: z.string().optional().nullable(),
  workforce: z.number().default(0),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
});

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
    return { ...log, projectName: project?.name ?? null, photos };
  }),

  create: protectedProcedure.input(logInput).mutation(({ input, ctx }) =>
    db
      .insert(constructionLogs)
      .values({ ...input, recordedBy: ctx.user.name })
      .returning()
      .get(),
  ),

  update: protectedProcedure
    .input(logInput.extend({ id: z.number() }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      db.update(constructionLogs).set(data).where(eq(constructionLogs.id, id)).run();
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
});
