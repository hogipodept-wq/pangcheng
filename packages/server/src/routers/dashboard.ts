import { eq, desc } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../db.js';
import {
  projects,
  procurements,
  suppliers,
  clients,
  staff,
  projectBidItems,
  constructionLogs,
  inspectionPhotos,
} from '../schema.js';

export const dashboardRouter = router({
  summary: protectedProcedure.query(() => {
    const allProjects = db.select().from(projects).all();
    const allProcurements = db.select().from(procurements).all();
    const allSuppliers = db.select().from(suppliers).all();
    const allClients = db.select().from(clients).all();
    const allStaff = db.select().from(staff).all();

    const projectsByStatus = {
      planning: allProjects.filter((p) => p.status === 'planning').length,
      in_progress: allProjects.filter((p) => p.status === 'in_progress').length,
      completed: allProjects.filter((p) => p.status === 'completed').length,
      closed: allProjects.filter((p) => p.status === 'closed').length,
    };

    const procurementsByStatus = {
      draft: allProcurements.filter((p) => p.status === 'draft').length,
      pending: allProcurements.filter((p) => p.status === 'pending').length,
      approved: allProcurements.filter((p) => p.status === 'approved').length,
      ordered: allProcurements.filter((p) => p.status === 'ordered').length,
      received: allProcurements.filter((p) => p.status === 'received').length,
      completed: allProcurements.filter((p) => p.status === 'completed').length,
      cancelled: allProcurements.filter((p) => p.status === 'cancelled').length,
    };

    const totalContract = allProjects.reduce((s, p) => s + (p.contractAmount ?? 0), 0);
    const totalBudget = allProjects.reduce((s, p) => s + (p.budgetAmount ?? 0), 0);
    const totalProcurement = allProcurements
      .filter((p) => p.status !== 'cancelled' && p.status !== 'draft')
      .reduce((s, p) => s + (p.totalAmount ?? 0), 0);
    const pendingProcurement = allProcurements
      .filter((p) => p.status === 'pending')
      .reduce((s, p) => s + (p.totalAmount ?? 0), 0);

    const recentProcurements = db
      .select({
        id: procurements.id,
        code: procurements.code,
        title: procurements.title,
        status: procurements.status,
        totalAmount: procurements.totalAmount,
        createdAt: procurements.createdAt,
      })
      .from(procurements)
      .orderBy(desc(procurements.id))
      .limit(6)
      .all();

    const recentLogs = db
      .select({
        id: constructionLogs.id,
        projectId: constructionLogs.projectId,
        date: constructionLogs.date,
        summary: constructionLogs.summary,
        projectName: projects.name,
      })
      .from(constructionLogs)
      .leftJoin(projects, eq(constructionLogs.projectId, projects.id))
      .orderBy(desc(constructionLogs.id))
      .limit(6)
      .all();

    const activeProjects = allProjects
      .filter((p) => p.status === 'in_progress' || p.status === 'planning')
      .map((p) => {
        const spent = allProcurements
          .filter(
            (pr) =>
              pr.projectId === p.id && pr.status !== 'cancelled' && pr.status !== 'draft',
          )
          .reduce((s, pr) => s + (pr.totalAmount ?? 0), 0);
        const ratio = p.budgetAmount > 0 ? spent / p.budgetAmount : 0;
        const profit = (p.contractAmount ?? 0) - spent;
        const margin = p.contractAmount > 0 ? profit / p.contractAmount : 0;
        return {
          id: p.id,
          code: p.code,
          name: p.name,
          status: p.status,
          contractAmount: p.contractAmount,
          budgetAmount: p.budgetAmount,
          bidItemCount: db
            .select()
            .from(projectBidItems)
            .where(eq(projectBidItems.projectId, p.id))
            .all().length,
          spent,
          ratio,
          profit,
          margin,
        };
      });

    return {
      counts: {
        projects: allProjects.length,
        procurements: allProcurements.length,
        suppliers: allSuppliers.length,
        clients: allClients.length,
        staff: allStaff.length,
        photos: db.select().from(inspectionPhotos).all().length,
        logs: db.select().from(constructionLogs).all().length,
      },
      projectsByStatus,
      procurementsByStatus,
      finance: { totalContract, totalBudget, totalProcurement, pendingProcurement },
      recentProcurements,
      recentLogs,
      activeProjects,
    };
  }),
});
