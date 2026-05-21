import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { trpc } from '../trpc';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Textarea,
  type Column,
} from '../components/ui';
import { ProjectStatusBadge } from '../components/status';
import {
  formatCurrency,
  formatDate,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
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

const emptyForm = {
  name: '',
  clientId: '' as string,
  status: 'planning' as ProjectStatus,
  address: '',
  manager: '',
  startDate: '',
  endDate: '',
  contractAmount: 0,
  budgetAmount: 0,
  description: '',
};

export function Projects() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.project.list.useQuery();
  const clients = trpc.clients.list.useQuery();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const create = trpc.project.create.useMutation({
    onSuccess: (created) => {
      void utils.project.list.invalidate();
      setOpen(false);
      navigate(`/projects/${created.id}`);
    },
    onError: (e) => setError(e.message),
  });

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

  const submit = () => {
    setError('');
    if (!form.name.trim()) {
      setError('請輸入專案名稱');
      return;
    }
    create.mutate({
      name: form.name,
      clientId: form.clientId ? Number(form.clientId) : null,
      status: form.status,
      address: form.address,
      manager: form.manager,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      contractAmount: Number(form.contractAmount),
      budgetAmount: Number(form.budgetAmount),
      description: form.description,
    });
  };

  return (
    <div>
      <PageHeader
        title="專案管理"
        subtitle="管理工程專案、人員配置與標單"
        actions={
          <Button
            onClick={() => {
              setForm(emptyForm);
              setError('');
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> 新增專案
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
          <EmptyState title="尚無專案資料" description="點擊右上角「新增專案」開始建立" />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/projects/${r.id}`)}
          />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新增專案"
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button loading={create.isPending} onClick={submit}>
              建立專案
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="專案名稱" required error={error}>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
          </div>
          <Field label="業主">
            <Select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            >
              <option value="">未指定</option>
              {(clients.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="狀態">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="專案經理">
            <Input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
          </Field>
          <Field label="工程地址">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="開工日">
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Field>
          <Field label="完工日">
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </Field>
          <Field label="合約金額">
            <Input
              type="number"
              value={form.contractAmount}
              onChange={(e) => setForm({ ...form, contractAmount: Number(e.target.value) })}
            />
          </Field>
          <Field label="預算金額">
            <Input
              type="number"
              value={form.budgetAmount}
              onChange={(e) => setForm({ ...form, budgetAmount: Number(e.target.value) })}
            />
          </Field>
          <div className="col-span-2">
            <Field label="專案說明">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
