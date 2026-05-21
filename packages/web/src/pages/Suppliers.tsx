import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Star } from 'lucide-react';
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
  Badge,
  type Column,
} from '../components/ui';
import { TRADE_CATEGORIES, TRADE_CATEGORY_LABELS, type TradeCategory } from '@pangcheng/shared';

type SupplierRow = {
  id: number;
  name: string;
  taxId: string | null;
  tradeCategory: string;
  contactPerson: string | null;
  phone: string | null;
  rating: number;
  active: boolean;
};

const emptyForm = {
  name: '',
  taxId: '',
  tradeCategory: 'other' as TradeCategory,
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  rating: 0,
  note: '',
  active: true,
};

export function RatingStars({ value }: { value: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </span>
  );
}

export function Suppliers() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.supplier.list.useQuery();
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const create = trpc.supplier.create.useMutation({
    onSuccess: () => {
      void utils.supplier.list.invalidate();
      setOpen(false);
    },
    onError: (e) => setError(e.message),
  });

  const rows = useMemo(() => {
    const list = (data ?? []) as SupplierRow[];
    const k = keyword.trim();
    if (!k) return list;
    return list.filter((s) => s.name.includes(k) || (s.contactPerson ?? '').includes(k));
  }, [data, keyword]);

  const columns: Column<SupplierRow>[] = [
    { header: '廠商名稱', render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    {
      header: '工種',
      render: (r) => (
        <Badge tone="blue">
          {TRADE_CATEGORY_LABELS[r.tradeCategory as TradeCategory] ?? r.tradeCategory}
        </Badge>
      ),
    },
    { header: '聯絡人', render: (r) => r.contactPerson || '-' },
    { header: '電話', render: (r) => r.phone || '-' },
    { header: '評鑑', render: (r) => <RatingStars value={r.rating} /> },
    {
      header: '狀態',
      render: (r) =>
        r.active ? <Badge tone="green">合作中</Badge> : <Badge tone="gray">停用</Badge>,
    },
  ];

  const submit = () => {
    setError('');
    if (!form.name.trim()) {
      setError('請輸入廠商名稱');
      return;
    }
    create.mutate(form);
  };

  return (
    <div>
      <PageHeader
        title="廠商管理"
        subtitle="管理協力廠商、工種分類與評鑑"
        actions={
          <Button
            onClick={() => {
              setForm(emptyForm);
              setError('');
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> 新增廠商
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
              placeholder="搜尋廠商名稱 / 聯絡人"
              className="pl-9"
            />
          </div>
        </div>
        {isLoading ? (
          <Spinner label="載入廠商資料…" />
        ) : rows.length === 0 ? (
          <EmptyState title="尚無廠商資料" description="點擊右上角「新增廠商」開始建立" />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/suppliers/${r.id}`)}
          />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新增廠商"
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
          <Field label="廠商名稱" required error={error}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="工種分類">
              <Select
                value={form.tradeCategory}
                onChange={(e) =>
                  setForm({ ...form, tradeCategory: e.target.value as TradeCategory })
                }
              >
                {TRADE_CATEGORIES.map((t) => (
                  <option key={t} value={t}>
                    {TRADE_CATEGORY_LABELS[t]}
                  </option>
                ))}
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
            <Field label="聯絡人">
              <Input
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
            </Field>
            <Field label="電話">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="電子郵件">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="評鑑（0-5 星）">
              <Select
                value={String(form.rating)}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} 星
                  </option>
                ))}
              </Select>
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
