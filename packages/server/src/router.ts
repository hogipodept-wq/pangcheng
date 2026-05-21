import { router } from './trpc.js';
import { authRouter } from './routers/auth.js';
import { userRouter } from './routers/user.js';
import { dashboardRouter } from './routers/dashboard.js';
import { projectRouter } from './routers/project.js';
import { clientRouter } from './routers/client.js';
import { supplierRouter } from './routers/supplier.js';
import { procurementRouter } from './routers/procurement.js';
import { staffRouter } from './routers/staff.js';
import { constructionLogRouter } from './routers/constructionLog.js';
import { inspectionPhotoRouter } from './routers/inspectionPhoto.js';
import { companySettingsRouter } from './routers/companySettings.js';
import { notificationRouter } from './routers/notification.js';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  dashboard: dashboardRouter,
  project: projectRouter,
  clients: clientRouter,
  supplier: supplierRouter,
  procurement: procurementRouter,
  staff: staffRouter,
  constructionLog: constructionLogRouter,
  inspectionPhoto: inspectionPhotoRouter,
  companySettings: companySettingsRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
