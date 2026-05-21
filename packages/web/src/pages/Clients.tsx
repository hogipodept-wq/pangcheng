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

type ClientRow = { id: number; name: string; taxId: string | null; type: string; phone: string | null; email: string | null; address: string | null; note: string | null };

const emptyForm = {
  name: '',
  taxId: '',
  type: 'company',
  phone: '',
  email: '',
  address: '',
  note: '',
};

export function Clients() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.clients.list.useQuery();
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const create = trpc.clients.create.useMutation({
    onSuccess: () => {
      void utils.clients.list.invalidate();
      setOpen(false);
    },
    onError: (e) => setError(e.message),
  });

  const rows = useMemo(() => {
    const list = (data ?? []) as ClientRow[];
    const k = keyword.trim();
    if (!k) return list;
    return list.filter(
      (c) => c.name.includes(k) || (c.taxId ?? '').includes(k) || (c.phone ?? '').includes(k),
    );
  }, [data, keyword]);

  const columns: Column<ClientRow>[] = [
    { header: '業主名稱', render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { header: '類型', render: (r) => (r.type === 'individual' ? '個人' : '公司') },
    { header: '統一編號', render: (r) => r.taxId || '-' },
    { header: '聯絡電話', render: (r) => r.phone || '-' },
    { header: '地址', render: (r) => r.address || '-', className: 'max-w-xs truncate' },
  ];

  const submit = () => {
    setError('');
    if (!form.name.trim()) {
      setError('請輸入業主名稱');
      return;
    }
    create.mutate(form);
  };

  return (
    <div>
      <PageHeader
        title="業主管理"
        subtitle="管理委託業主與聯絡資訊"
        actions={
          <Button
            onClick={() => {
              setForm(emptyForm);
              setError('');
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            新增業主
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
              placeholder="搜尋名稱 / 統編 / 電話"
              className="pl-9"
            />
          </div>
        </div>
        {isLoading ? (
          <Spinner label="載入業主資料…" />
        ) : rows.length === 0 ? (
          <EmptyState title="尚無業主資料" description="點擊右上角「新增業主」開始建立" />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/clients/${r.id}`)}
          />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新增業主"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button loading={create.isPending} onClick={submit}>
              建立
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="業主名稱" required error={error}>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="公司或個人名稱"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="類型">
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="company">公司</option>
                <option value="individual">個人</option>
              </Select>
            </Field>
            <Field label="統一編號">
              <Input
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="聯絡電話">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="電子郵件">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <Field label="地址">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="備註">
            <Textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
