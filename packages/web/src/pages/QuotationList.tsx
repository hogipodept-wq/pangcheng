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
import { QuotationStatusBadge } from '../components/status';
import {
  formatCurrency,
  formatDate,
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABELS,
} from '@pangcheng/shared';

type Row = {
  id: number;
  code: string;
  projectName: string;
  clientName: string | null;
  status: string;
  quoteDate: string | null;
  validUntil: string | null;
  totalAmount: number;
};

export function QuotationList() {
  const navigate = useNavigate();
  const { data, isLoading } = trpc.quotation.list.useQuery();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const rows = useMemo(() => {
    let list = (data ?? []) as Row[];
    const k = keyword.trim();
    if (k)
      list = list.filter(
        (q) => q.projectName.includes(k) || q.code.includes(k) || (q.clientName ?? '').includes(k),
      );
    if (statusFilter) list = list.filter((q) => q.status === statusFilter);
    return list;
  }, [data, keyword, statusFilter]);

  const columns: Column<Row>[] = [
    { header: '報價單號', render: (r) => <span className="font-mono text-xs text-gray-500">{r.code}</span> },
    { header: '報價名稱', render: (r) => <span className="font-medium text-ink">{r.projectName}</span> },
    { header: '客戶', render: (r) => r.clientName || '-' },
    { header: '狀態', render: (r) => <QuotationStatusBadge status={r.status} /> },
    { header: '報價日期', render: (r) => formatDate(r.quoteDate) },
    { header: '有效期限', render: (r) => formatDate(r.validUntil) },
    { header: '報價總額', render: (r) => formatCurrency(r.totalAmount), align: 'right' },
  ];

  return (
    <div>
      <PageHeader
        title="報價作業"
        subtitle="報價單建立、項目明細與簽核管理"
        actions={
          <Button onClick={() => navigate('/quotations/new')}>
            <Plus className="h-4 w-4" /> 新增報價
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
              placeholder="搜尋報價名稱 / 單號 / 客戶"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="max-w-40"
          >
            <option value="">全部狀態</option>
            {QUOTATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {QUOTATION_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        {isLoading ? (
          <Spinner label="載入報價資料…" />
        ) : rows.length === 0 ? (
          <EmptyState title="尚無報價單" description="點擊右上角「新增報價」開始建立" />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/quotations/${r.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
