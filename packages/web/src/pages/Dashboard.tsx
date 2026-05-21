import { Link } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  ShoppingCart,
  CheckCircle2,
  UserPlus,
  FolderPlus,
  ClipboardPlus,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { trpc } from '../trpc';
import { Card, SectionTitle, Spinner, EmptyState } from '../components/ui';
import { useAuth } from '../auth';
import {
  formatCurrency,
  PROJECT_STATUS_LABELS,
  ROLE_LABELS,
  type Role,
} from '@pangcheng/shared';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '凌晨好';
  if (h < 12) return '早安';
  if (h < 18) return '午安';
  return '晚安';
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  to,
}: {
  label: string;
  value: number;
  sub: string;
  icon: LucideIcon;
  tone: string;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="p-5 transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <p className="text-sm text-gray-500">{label}</p>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
        <p className="mt-1 text-xs text-gray-400">{sub}</p>
      </Card>
    </Link>
  );
}

const STATUS_BAR_TONE: Record<string, string> = {
  planning: 'bg-blue-500',
  in_progress: 'bg-brand-600',
  completed: 'bg-emerald-500',
  closed: 'bg-zinc-400',
};

const QUICK_ACTIONS: { to: string; label: string; icon: LucideIcon; tone: string }[] = [
  { to: '/staff', label: '新增人員', icon: UserPlus, tone: 'bg-blue-50 text-blue-600' },
  { to: '/projects', label: '建立專案', icon: FolderPlus, tone: 'bg-brand-50 text-brand-600' },
  { to: '/procurement/new', label: '新增採購單', icon: ClipboardPlus, tone: 'bg-amber-50 text-amber-600' },
];

export function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = trpc.dashboard.summary.useQuery();

  if (isLoading || !data) return <Spinner label="載入儀表板…" />;

  const { counts, projectsByStatus, procurementsByStatus, activeProjects } = data;
  const statusEntries = (
    ['planning', 'in_progress', 'completed', 'closed'] as const
  ).map((s) => ({ key: s, label: PROJECT_STATUS_LABELS[s], count: projectsByStatus[s] }));
  const maxStatus = Math.max(1, ...statusEntries.map((e) => e.count));

  return (
    <div className="space-y-5">
      {/* 問候 */}
      <div>
        <h2 className="text-2xl font-bold text-ink">
          {greeting()}，{user?.name}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          歡迎回到營造工程管理系統 · 角色：{ROLE_LABELS[(user?.role ?? 'user') as Role]}
        </p>
      </div>

      {/* 統計卡 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="人員總數"
          value={counts.staff}
          sub={`目前在職 ${counts.staff} 人`}
          icon={Users}
          tone="bg-blue-50 text-blue-600"
          to="/staff"
        />
        <StatCard
          label="進行中專案"
          value={projectsByStatus.in_progress}
          sub={`共 ${counts.projects} 個專案`}
          icon={FolderKanban}
          tone="bg-brand-50 text-brand-600"
          to="/projects"
        />
        <StatCard
          label="待審核採購"
          value={procurementsByStatus.pending}
          sub={`共 ${counts.procurements} 筆`}
          icon={ShoppingCart}
          tone="bg-amber-50 text-amber-600"
          to="/procurement"
        />
        <StatCard
          label="已完工專案"
          value={projectsByStatus.completed}
          sub={`規劃中 ${projectsByStatus.planning} 個`}
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600"
          to="/projects"
        />
      </div>

      {/* 快捷操作 + 專案狀態 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle>快捷操作</SectionTitle>
          <div className="space-y-2 p-4">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.tone}`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <span className="flex-1 text-sm font-medium text-ink">{a.label}</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>專案狀態概覽</SectionTitle>
          <div className="space-y-3 p-4">
            {statusEntries.map((e) => (
              <div key={e.key} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-sm text-gray-600">{e.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${STATUS_BAR_TONE[e.key]}`}
                    style={{ width: `${(e.count / maxStatus) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-bold text-ink">
                  {e.count}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 專案毛利追蹤 */}
      <Card>
        <SectionTitle
          action={
            <Link to="/projects" className="text-xs text-brand-600 hover:underline">
              查看全部
            </Link>
          }
        >
          專案毛利追蹤
        </SectionTitle>
        {activeProjects.length === 0 ? (
          <EmptyState title="目前沒有進行中的專案" />
        ) : (
          <div className="divide-y divide-gray-50">
            {activeProjects.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                    <FolderKanban className="h-4 w-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {p.bidItemCount > 0 ? `${p.bidItemCount} 項標單項目` : '尚無標單項目'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {p.contractAmount > 0 ? (
                    <>
                      <p
                        className={`text-sm font-bold ${p.profit >= 0 ? 'text-emerald-600' : 'text-brand-600'}`}
                      >
                        {p.profit >= 0 ? '+' : ''}
                        {formatCurrency(p.profit)}
                      </p>
                      <p className="text-xs text-gray-400">
                        毛利率 {(p.margin * 100).toFixed(1)}%
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-300">尚未設定</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
