import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { trpc } from '../trpc';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
  type Column,
} from '../components/ui';
import { ProjectStatusBadge } from '../components/status';
import {
  formatCurrency,
  formatDate,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
} from '@pangcheng/shared';

type ProjectRow = {
  id: number;
  code: string;
  name: string;
  clientName: string | null;
  status: string;
  manager: string | null;
  startDate: string | null;
  endDate: string | null;
  contractAmount: number;
  budgetAmount: number;
};

export function Projects() {
  const navigate = useNavigate();
  const { data, isLoading } = trpc.project.list.useQuery();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const rows = useMemo(() => {
    let list = (data ?? []) as ProjectRow[];
    const k = keyword.trim();
    if (k) list = list.filter((p) => p.name.includes(k) || p.code.includes(k));
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    return list;
  }, [data, keyword, statusFilter]);

  const columns: Column<ProjectRow>[] = [
    { header: '專案編號', render: (r) => <span className="font-mono text-xs text-gray-500">{r.code}</span> },
    { header: '專案名稱', render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { header: '業主', render: (r) => r.clientName || '-' },
    { header: '專案經理', render: (r) => r.manager || '-' },
    { header: '狀態', render: (r) => <ProjectStatusBadge status={r.status} /> },
    { header: '合約金額', render: (r) => formatCurrency(r.contractAmount), align: 'right' },
    { header: '工期', render: (r) => `${formatDate(r.startDate)} ~ ${formatDate(r.endDate)}` },
  ];

  return (
    <div>
      <PageHeader
        title="專案管理"
        subtitle="管理工程專案、人員配置與標單"
        actions={
          <Button onClick={() => navigate('/projects/new')}>
            <Plus className="h-4 w-4" /> 建立專案
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-gray-100 p-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋專案名稱 / 編號"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="max-w-40"
          >
            <option value="">全部狀態</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        {isLoading ? (
          <Spinner label="載入專案資料…" />
        ) : rows.length === 0 ? (
          <EmptyState title="尚無專案資料" description="點擊右上角「建立專案」開始建立" />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/projects/${r.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
