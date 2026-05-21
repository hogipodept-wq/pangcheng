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
import { ProcurementStatusBadge } from '../components/status';
import {
  formatCurrency,
  formatDate,
  PROCUREMENT_STATUSES,
  PROCUREMENT_STATUS_LABELS,
} from '@pangcheng/shared';

type Row = {
  id: number;
  code: string;
  title: string;
  status: string;
  totalAmount: number;
  requestDate: string | null;
  projectName: string | null;
  supplierName: string | null;
};

export function Procurement() {
  const navigate = useNavigate();
  const { data, isLoading } = trpc.procurement.list.useQuery();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const rows = useMemo(() => {
    let list = (data ?? []) as Row[];
    const k = keyword.trim();
    if (k) list = list.filter((p) => p.title.includes(k) || p.code.includes(k));
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    return list;
  }, [data, keyword, statusFilter]);

  const columns: Column<Row>[] = [
    { header: '採購單號', render: (r) => <span className="font-mono text-xs text-gray-500">{r.code}</span> },
    { header: '採購標題', render: (r) => <span className="font-medium text-ink">{r.title}</span> },
    { header: '專案', render: (r) => r.projectName || '-' },
    { header: '廠商', render: (r) => r.supplierName || '-' },
    { header: '狀態', render: (r) => <ProcurementStatusBadge status={r.status} /> },
    { header: '金額', render: (r) => formatCurrency(r.totalAmount), align: 'right' },
    { header: '請購日', render: (r) => formatDate(r.requestDate) },
  ];

  return (
    <div>
      <PageHeader
        title="採購管理"
        subtitle="採購單建立、廠商比價與收貨確認"
        actions={
          <Button onClick={() => navigate('/procurement/new')}>
            <Plus className="h-4 w-4" /> 新增採購單
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
              placeholder="搜尋採購標題 / 單號"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="max-w-40"
          >
            <option value="">全部狀態</option>
            {PROCUREMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROCUREMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        {isLoading ? (
          <Spinner label="載入採購資料…" />
        ) : rows.length === 0 ? (
          <EmptyState title="尚無採購單" description="點擊右上角「新增採購單」開始建立" />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/procurement/${r.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
