import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import { clients, clientContacts, projects } from '../schema.js';

const clientInput = z.object({
  name: z.string().min(1, '請輸入業主名稱'),
  taxId: z.string().optional().nullable(),
  type: z.string().default('company'),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

const contactInput = z.object({
  clientId: z.number(),
  name: z.string().min(1),
  title: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
  note: z.string().optional().nullable(),
});

export const clientRouter = router({
  list: protectedProcedure.query(() => db.select().from(clients).orderBy(desc(clients.id)).all()),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
    const client = db.select().from(clients).where(eq(clients.id, input.id)).get();
    if (!client) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到業主資料' });
    const contacts = db
      .select()
      .from(clientContacts)
      .where(eq(clientContacts.clientId, input.id))
      .all();
    const relatedProjects = db
      .select()
      .from(projects)
      .where(eq(projects.clientId, input.id))
      .all();
    return { ...client, contacts, projects: relatedProjects };
  }),

  create: protectedProcedure.input(clientInput).mutation(({ input }) =>
    db.insert(clients).values(input).returning().get(),
  ),

  update: protectedProcedure
    .input(clientInput.extend({ id: z.number() }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      db.update(clients).set(data).where(eq(clients.id, id)).run();
      return { ok: true };
    }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
    db.delete(clientContacts).where(eq(clientContacts.clientId, input.id)).run();
    db.delete(clients).where(eq(clients.id, input.id)).run();
    return { ok: true };
  }),

  addContact: protectedProcedure.input(contactInput).mutation(({ input }) =>
    db.insert(clientContacts).values(input).returning().get(),
  ),

  updateContact: protectedProcedure
    .input(contactInput.extend({ id: z.number() }))
    .mutation(({ input }) => {
      const { id, clientId, ...data } = input;
      db.update(clientContacts).set(data).where(eq(clientContacts.id, id)).run();
      return { ok: true };
    }),

  deleteContact: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      db.delete(clientContacts).where(eq(clientContacts.id, input.id)).run();
      return { ok: true };
    }),
});
