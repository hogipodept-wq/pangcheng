import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Procurement } from './pages/Procurement';
import { ProcurementForm } from './pages/ProcurementForm';
import { ProcurementDetail } from './pages/ProcurementDetail';
import { Suppliers } from './pages/Suppliers';
import { SupplierDetail } from './pages/SupplierDetail';
import { Clients } from './pages/Clients';
import { ClientDetail } from './pages/ClientDetail';
import { Staff } from './pages/Staff';
import { ConstructionLogs } from './pages/ConstructionLogs';
import { ConstructionLogDetail } from './pages/ConstructionLogDetail';
import { Photos } from './pages/Photos';
import { Settings } from './pages/Settings';
import { Placeholder } from './pages/Placeholder';
import { NotFound } from './pages/NotFound';

function RequireAuth() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label="載入中…" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/procurement" element={<Procurement />} />
          <Route path="/procurement/new" element={<ProcurementForm />} />
          <Route path="/procurement/:id" element={<ProcurementDetail />} />
          <Route path="/procurement/:id/edit" element={<ProcurementForm />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/suppliers/:id" element={<SupplierDetail />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/construction-logs" element={<ConstructionLogs />} />
          <Route path="/construction-logs/:id" element={<ConstructionLogDetail />} />
          <Route path="/photos" element={<Photos />} />
          <Route
            path="/quotations"
            element={<Placeholder title="報價作業" description="報價單建立、PDF 產出、簽核流程" />}
          />
          <Route
            path="/quotation-templates"
            element={<Placeholder title="報價範本" description="常用報價項目範本管理" />}
          />
          <Route
            path="/finance"
            element={<Placeholder title="財務作業" description="會計傳票、日記帳、分類帳" />}
          />
          <Route
            path="/petty-cash"
            element={<Placeholder title="零用金管理" description="撥款、支出、沖銷與餘額追蹤" />}
          />
          <Route
            path="/calendar"
            element={<Placeholder title="行事曆" description="專案排程與重要事件" />}
          />
          <Route
            path="/reports"
            element={<Placeholder title="報表中心" description="採購統計、專案預算、零用金月報" />}
          />
          <Route path="/permissions" element={<Settings defaultTab="users" />} />
          <Route path="/company" element={<Settings defaultTab="company" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
