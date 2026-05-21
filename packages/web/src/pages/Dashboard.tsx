import { Link } from 'react-router-dom';
import {
  FolderKanban,
  ShoppingCart,
  Truck,
  Building2,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { trpc } from '../trpc';
import { Card, SectionTitle, Spinner, PageHeader, EmptyState } from '../components/ui';
import { ProcurementStatusBadge } from '../components/status';
import {
  formatCurrency,
  formatDate,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from '@pangcheng/shared';

function StatCard({
  label,
  value,
  icon: Icon,
  to,
  tone,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  to: string;
  tone: string;
}) {
  return (
    <Link to={to}>
      <Card className="flex items-center gap-4 p-4 transition hover:shadow-md">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-ink">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </Card>
    </Link>
  );
}

function MoneyCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ? 'text-brand-600' : 'text-ink'}`}>
        {formatCurrency(value)}
      </p>
    </Card>
  );
}

export function Dashboard() {
  const { data, isLoading } = trpc.dashboard.summary.useQuery();

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="儀表板" subtitle="營運總覽" />
        <Spinner label="載入儀表板…" />
      </div>
    );
  }

  const { counts, projectsByStatus, finance, recentProcurements, recentLogs, activeProjects } =
    data;

  return (
    <div>
      <PageHeader title="儀表板" subtitle="磐承營造工程營運總覽" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="進行中專案"
          value={`${projectsByStatus.in_progress} / ${counts.projects}`}
          icon={FolderKanban}
          to="/projects"
          tone="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="採購單總數"
          value={counts.procurements}
          icon={ShoppingCart}
          to="/procurement"
          tone="bg-brand-50 text-brand-600"
        />
        <StatCard
          label="合作廠商"
          value={counts.suppliers}
          icon={Truck}
          to="/suppliers"
          tone="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="業主數"
          value={counts.clients}
          icon={Building2}
          to="/clients"
          tone="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MoneyCard label="合約總額" value={finance.totalContract} />
        <MoneyCard label="預算總額" value={finance.totalBudget} />
        <MoneyCard label="已採購支出" value={finance.totalProcurement} accent />
        <MoneyCard label="待審核採購" value={finance.pendingProcurement} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* 進行中專案預算 */}
        <Card className="lg:col-span-2">
          <SectionTitle>進行中專案預算執行</SectionTitle>
          <div className="p-4">
            {activeProjects.length === 0 ? (
              <EmptyState title="目前沒有進行中的專案" />
            ) : (
              <div className="space-y-4">
                {activeProjects.map((p) => {
                  const pct = Math.min(Math.round(p.ratio * 100), 100);
                  const over = p.ratio > 0.9;
                  return (
                    <div key={p.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <Link
                          to={`/projects/${p.id}`}
                          className="font-medium text-ink hover:text-brand-600"
                        >
                          {p.code} {p.name}
                        </Link>
                        <span className="text-xs text-gray-500">
                          {formatCurrency(p.spent)} / {formatCurrency(p.budgetAmount)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${over ? 'bg-brand-600' : 'bg-blue-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* 專案狀態 */}
        <Card>
          <SectionTitle>專案狀態分布</SectionTitle>
          <div className="space-y-2 p-4">
            {(Object.keys(projectsByStatus) as ProjectStatus[]).map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{PROJECT_STATUS_LABELS[s]}</span>
                <span className="font-bold text-ink">{projectsByStatus[s]}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-400">
              <TrendingUp className="h-3.5 w-3.5" />
              共 {counts.projects} 個專案
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* 最近採購 */}
        <Card>
          <SectionTitle
            action={
              <Link to="/procurement" className="text-xs text-brand-600 hover:underline">
                查看全部
              </Link>
            }
          >
            最近採購單
          </SectionTitle>
          <div className="divide-y divide-gray-50">
            {recentProcurements.length === 0 && <EmptyState title="尚無採購單" />}
            {recentProcurements.map((p) => (
              <Link
                key={p.id}
                to={`/procurement/${p.id}`}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.code}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">
                    {formatCurrency(p.totalAmount)}
                  </span>
                  <ProcurementStatusBadge status={p.status} />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* 最近施工日誌 */}
        <Card>
          <SectionTitle
            action={
              <Link to="/construction-logs" className="text-xs text-brand-600 hover:underline">
                查看全部
              </Link>
            }
          >
            最近施工日誌
          </SectionTitle>
          <div className="divide-y divide-gray-50">
            {recentLogs.length === 0 && <EmptyState title="尚無施工日誌" />}
            {recentLogs.map((l) => (
              <Link
                key={l.id}
                to={`/construction-logs/${l.id}`}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {l.summary || '施工紀錄'}
                  </p>
                  <p className="text-xs text-gray-400">{l.projectName}</p>
                </div>
                <span className="text-xs text-gray-500">{formatDate(l.date)}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
