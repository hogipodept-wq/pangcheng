import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import { inspectionPhotos, projects } from '../schema.js';
import { PHOTO_CATEGORIES } from '@pangcheng/shared';

const photoInput = z.object({
  projectId: z.number(),
  constructionLogId: z.number().nullable().optional(),
  category: z.enum(PHOTO_CATEGORIES).default('during'),
  title: z.string().optional().nullable(),
  photoUrl: z.string().min(1, '請先上傳照片'),
  takenAt: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const inspectionPhotoRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number().optional() }).optional())
    .query(({ input }) => {
      const rows = db
        .select({
          id: inspectionPhotos.id,
          projectId: inspectionPhotos.projectId,
          constructionLogId: inspectionPhotos.constructionLogId,
          category: inspectionPhotos.category,
          title: inspectionPhotos.title,
          photoUrl: inspectionPhotos.photoUrl,
          takenAt: inspectionPhotos.takenAt,
          location: inspectionPhotos.location,
          description: inspectionPhotos.description,
          uploadedBy: inspectionPhotos.uploadedBy,
          createdAt: inspectionPhotos.createdAt,
          projectName: projects.name,
        })
        .from(inspectionPhotos)
        .leftJoin(projects, eq(inspectionPhotos.projectId, projects.id))
        .orderBy(desc(inspectionPhotos.id))
        .all();
      return input?.projectId ? rows.filter((r) => r.projectId === input.projectId) : rows;
    }),

  create: protectedProcedure.input(photoInput).mutation(({ input, ctx }) =>
    db
      .insert(inspectionPhotos)
      .values({ ...input, uploadedBy: ctx.user.name })
      .returning()
      .get(),
  ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        category: z.enum(PHOTO_CATEGORIES),
        title: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      db.update(inspectionPhotos).set(data).where(eq(inspectionPhotos.id, id)).run();
      return { ok: true };
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.delete(inspectionPhotos).where(eq(inspectionPhotos.id, input.id)).run();
    return { ok: true };
  }),
});
