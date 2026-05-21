import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { trpc } from '../trpc';
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SectionTitle,
  Select,
  Spinner,
} from '../components/ui';
import {
  formatCurrency,
  PROCUREMENT_STATUSES,
  PROCUREMENT_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type ProcurementStatus,
  type PaymentMethod,
} from '@pangcheng/shared';

interface ItemRow {
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  note: string;
}

const blankItem: ItemRow = { name: '', spec: '', unit: '', quantity: 1, unitPrice: 0, note: '' };

export function ProcurementForm() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const projects = trpc.project.list.useQuery();
  const suppliers = trpc.supplier.list.useQuery();
  const existing = trpc.procurement.get.useQuery(
    { id: editId ?? 0 },
    { enabled: editId !== null },
  );

  const [form, setForm] = useState({
    title: '',
    projectId: '',
    supplierId: '',
    status: 'draft' as ProcurementStatus,
    paymentMethod: 'bank_transfer' as PaymentMethod,
    requestedBy: '',
    requestDate: '',
    expectedDate: '',
    note: '',
  });
  const [items, setItems] = useState<ItemRow[]>([{ ...blankItem }]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editId !== null && existing.data) {
      const d = existing.data;
      setForm({
        title: d.title,
        projectId: d.projectId ? String(d.projectId) : '',
        supplierId: d.supplierId ? String(d.supplierId) : '',
        status: d.status as ProcurementStatus,
        paymentMethod: d.paymentMethod as PaymentMethod,
        requestedBy: d.requestedBy ?? '',
        requestDate: d.requestDate ?? '',
        expectedDate: d.expectedDate ?? '',
        note: d.note ?? '',
      });
      setItems(
        d.items.length
          ? d.items.map((it) => ({
              name: it.name,
              spec: it.spec ?? '',
              unit: it.unit ?? '',
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              note: it.note ?? '',
            }))
          : [{ ...blankItem }],
      );
    }
  }, [editId, existing.data]);

  const create = trpc.procurement.create.useMutation({
    onSuccess: (created) => {
      void utils.procurement.list.invalidate();
      navigate(`/procurement/${created.id}`);
    },
    onError: (e) => setError(e.message),
  });
  const update = trpc.procurement.update.useMutation({
    onSuccess: () => {
      void utils.procurement.invalidate();
      navigate(`/procurement/${editId}`);
    },
    onError: (e) => setError(e.message),
  });

  if (editId !== null && existing.isLoading) return <Spinner label="載入採購單…" />;

  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  const updateItem = (index: number, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const submit = () => {
    setError('');
    if (!form.title.trim()) {
      setError('請輸入採購標題');
      return;
    }
    const validItems = items.filter((it) => it.name.trim());
    const payload = {
      title: form.title,
      projectId: form.projectId ? Number(form.projectId) : null,
      supplierId: form.supplierId ? Number(form.supplierId) : null,
      status: form.status,
      paymentMethod: form.paymentMethod,
      requestedBy: form.requestedBy,
      requestDate: form.requestDate || null,
      expectedDate: form.expectedDate || null,
      note: form.note,
      items: validItems.map((it) => ({
        name: it.name,
        spec: it.spec,
        unit: it.unit,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        note: it.note,
      })),
    };
    if (editId !== null) update.mutate({ id: editId, ...payload });
    else create.mutate(payload);
  };

  return (
    <div>
      <Link
        to={editId !== null ? `/procurement/${editId}` : '/procurement'}
        className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </Link>
      <PageHeader title={editId !== null ? '編輯採購單' : '新增採購單'} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <SectionTitle>採購資訊</SectionTitle>
          <div className="space-y-3 p-4">
            <Field label="採購標題" required error={error}>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="所屬專案">
              <Select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                <option value="">未指定</option>
                {(projects.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="供應廠商">
              <Select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              >
                <option value="">未指定</option>
                {(suppliers.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="狀態">
                <Select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as ProcurementStatus })
                  }
                >
                  {PROCUREMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PROCUREMENT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="付款方式">
                <Select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })
                  }
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="請購人">
              <Input
                value={form.requestedBy}
                onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="請購日">
                <Input
                  type="date"
                  value={form.requestDate}
                  onChange={(e) => setForm({ ...form, requestDate: e.target.value })}
                />
              </Field>
              <Field label="期望到貨日">
                <Input
                  type="date"
                  value={form.expectedDate}
                  onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                />
              </Field>
            </div>
            <Field label="備註">
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setItems([...items, { ...blankItem }])}
              >
                <Plus className="h-3.5 w-3.5" /> 新增品項
              </Button>
            }
          >
            採購品項明細
          </SectionTitle>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="px-2 py-2">品項名稱</th>
                  <th className="px-2 py-2">規格</th>
                  <th className="px-2 py-2 w-20">數量</th>
                  <th className="px-2 py-2 w-16">單位</th>
                  <th className="px-2 py-2 w-28">單價</th>
                  <th className="px-2 py-2 w-28 text-right">小計</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-1 py-1.5">
                      <Input
                        value={it.name}
                        onChange={(e) => updateItem(i, { name: e.target.value })}
                        placeholder="品項"
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        value={it.spec}
                        onChange={(e) => updateItem(i, { spec: e.target.value })}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        type="number"
                        value={it.quantity}
                        onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        value={it.unit}
                        onChange={(e) => updateItem(i, { unit: e.target.value })}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        type="number"
                        value={it.unitPrice}
                        onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right font-medium text-ink">
                      {formatCurrency(it.quantity * it.unitPrice)}
                    </td>
                    <td className="px-1 py-1.5">
                      <button
                        onClick={() =>
                          setItems(items.length > 1 ? items.filter((_, x) => x !== i) : items)
                        }
                        className="rounded-md p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
              <span className="text-sm text-gray-500">採購總金額</span>
              <span className="text-xl font-bold text-brand-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(editId !== null ? `/procurement/${editId}` : '/procurement')}
        >
          取消
        </Button>
        <Button loading={create.isPending || update.isPending} onClick={submit}>
          {editId !== null ? '儲存變更' : '建立採購單'}
        </Button>
      </div>
    </div>
  );
}
