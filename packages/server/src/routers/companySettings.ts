import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure, roleProcedure } from '../trpc.js';
import { db } from '../db.js';
import { companySettings } from '../schema.js';

export const companySettingsRouter = router({
  get: protectedProcedure.query(() => {
    let row = db.select().from(companySettings).get();
    if (!row) {
      row = db.insert(companySettings).values({ name: '磐承營造工程' }).returning().get();
    }
    return row;
  }),

  update: roleProcedure('admin')
    .input(
      z.object({
        name: z.string().min(1),
        taxId: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        logoUrl: z.string().optional().nullable(),
      }),
    )
    .mutation(({ input }) => {
      const row = db.select().from(companySettings).get();
      if (row) {
        db.update(companySettings)
          .set({ ...input, updatedAt: new Date().toISOString() })
          .where(eq(companySettings.id, row.id))
          .run();
      } else {
        db.insert(companySettings).values(input).run();
      }
      return { ok: true };
    }),
});
