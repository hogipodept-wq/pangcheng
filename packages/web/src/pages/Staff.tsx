import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { trpc } from '../trpc';
import {
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Textarea,
  Badge,
  type Column,
} from '../components/ui';
import { formatCurrency, formatDate } from '@pangcheng/shared';

type StaffRow = {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  idNumber: string | null;
  hireDate: string | null;
  dailyWage: number;
  note: string | null;
  active: boolean;
};

const emptyForm = {
  name: '',
  role: '',
  phone: '',
  email: '',
  idNumber: '',
  hireDate: '',
  dailyWage: 0,
  note: '',
  active: true,
};

export function Staff() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.staff.list.useQuery();
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [delTarget, setDelTarget] = useState<StaffRow | null>(null);

  const create = trpc.staff.create.useMutation({
    onSuccess: () => {
      void utils.staff.list.invalidate();
      setOpen(false);
    },
    onError: (e) => setError(e.message),
  });
  const update = trpc.staff.update.useMutation({
    onSuccess: () => {
      void utils.staff.list.invalidate();
      setOpen(false);
    },
    onError: (e) => setError(e.message),
  });
  const remove = trpc.staff.delete.useMutation({
    onSuccess: () => {
      void utils.staff.list.invalidate();
      setDelTarget(null);
    },
  });

  const rows = useMemo(() => {
    const list = (data ?? []) as StaffRow[];
    const k = keyword.trim();
    if (!k) return list;
    return list.filter((s) => s.name.includes(k) || (s.role ?? '').includes(k));
  }, [data, keyword]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setError('');
    setOpen(true);
  };
  const openEdit = (s: StaffRow) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      role: s.role ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      idNumber: s.idNumber ?? '',
      hireDate: s.hireDate ?? '',
      dailyWage: s.dailyWage,
      note: s.note ?? '',
      active: s.active,
    });
    setError('');
    setOpen(true);
  };

  const submit = () => {
    setError('');
    if (!form.name.trim()) {
      setError('請輸入姓名');
      return;
    }
    if (editId) update.mutate({ id: editId, ...form });
    else create.mutate(form);
  };

  const columns: Column<StaffRow>[] = [
    { header: '姓名', render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { header: '職務', render: (r) => r.role || '-' },
    { header: '電話', render: (r) => r.phone || '-' },
    { header: '到職日', render: (r) => formatDate(r.hireDate) },
    { header: '日薪', render: (r) => formatCurrency(r.dailyWage), align: 'right' },
    {
      header: '狀態',
      render: (r) =>
        r.active ? <Badge tone="green">在職</Badge> : <Badge tone="gray">離職</Badge>,
    },
    {
      header: '操作',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => openEdit(r)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDelTarget(r)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="人員管理"
        subtitle="管理工地人員與基本資料"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> 新增人員
          </Button>
        }
      />

      <Card>
        <div className="border-b border-gray-100 p-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋姓名 / 職務"
              className="pl-9"
            />
          </div>
        </div>
        {isLoading ? (
          <Spinner label="載入人員資料…" />
        ) : rows.length === 0 ? (
          <EmptyState title="尚無人員資料" description="點擊右上角「新增人員」開始建立" />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? '編輯人員' : '新增人員'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button loading={create.isPending || update.isPending} onClick={submit}>
              {editId ? '儲存' : '建立'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="姓名" required error={error}>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="職務">
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="如：工地主任、鋼筋工"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="電話">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="電子郵件">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="到職日">
              <Input
                type="date"
                value={form.hireDate}
                onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
              />
            </Field>
            <Field label="日薪">
              <Input
                type="number"
                value={form.dailyWage}
                onChange={(e) => setForm({ ...form, dailyWage: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="身分證字號">
              <Input
                value={form.idNumber}
                onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
              />
            </Field>
            <Field label="在職狀態">
              <Select
                value={form.active ? '1' : '0'}
                onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}
              >
                <option value="1">在職</option>
                <option value="0">離職</option>
              </Select>
            </Field>
          </div>
          <Field label="備註">
            <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delTarget}
        title="刪除人員"
        message={`確定要刪除「${delTarget?.name}」嗎？此操作無法復原。`}
        loading={remove.isPending}
        onConfirm={() => delTarget && remove.mutate({ id: delTarget.id })}
        onClose={() => setDelTarget(null)}
      />
    </div>
  );
}
