import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
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
  Textarea,
} from '../components/ui';
import {
  formatCurrency,
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABELS,
  type QuotationStatus,
} from '@pangcheng/shared';

const ITEM_CATEGORIES = [
  '未分類',
  '假設工程',
  '土建工程',
  '結構工程',
  '裝修工程',
  '水電工程',
  '機電空調',
  '拆除工程',
  '雜項',
];

const DEFAULT_TERMS = `1. 本報價單有效期限為報價日起30天。
2. 付款方式依合約約定辦理。
3. 如有追加減工程，另行議價。
4. 以上報價不含營業稅。`;

const today = () => new Date().toISOString().slice(0, 10);

interface ItemRow {
  category: string;
  itemNo: string;
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

const blankItem: ItemRow = {
  category: '未分類',
  itemNo: '',
  name: '',
  spec: '',
  unit: '',
  quantity: 1,
  unitPrice: 0,
};

export function QuotationForm() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const clientOptions = trpc.quotation.clientOptions.useQuery();
  const existing = trpc.quotation.get.useQuery({ id: editId ?? 0 }, { enabled: editId !== null });

  const [form, setForm] = useState({
    projectName: '',
    description: '',
    status: 'draft' as QuotationStatus,
    quoteDate: today(),
    validUntil: '',
    startDate: '',
    endDate: '',
    duration: '',
    location: '',
    clientId: '',
    clientName: '',
    clientContact: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    discountPercent: 0,
    taxRate: 5,
    paymentTerms: '',
    terms: DEFAULT_TERMS,
    note: '',
  });
  const [items, setItems] = useState<ItemRow[]>([{ ...blankItem }]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editId !== null && existing.data) {
      const d = existing.data;
      setForm({
        projectName: d.projectName,
        description: d.description ?? '',
        status: d.status as QuotationStatus,
        quoteDate: d.quoteDate ?? today(),
        validUntil: d.validUntil ?? '',
        startDate: d.startDate ?? '',
        endDate: d.endDate ?? '',
        duration: d.duration ?? '',
        location: d.location ?? '',
        clientId: d.clientId ? String(d.clientId) : '',
        clientName: d.clientName ?? '',
        clientContact: d.clientContact ?? '',
        clientPhone: d.clientPhone ?? '',
        clientEmail: d.clientEmail ?? '',
        clientAddress: d.clientAddress ?? '',
        discountPercent: d.discountPercent,
        taxRate: d.taxRate,
        paymentTerms: d.paymentTerms ?? '',
        terms: d.terms ?? DEFAULT_TERMS,
        note: d.note ?? '',
      });
      setItems(
        d.items.length
          ? d.items.map((it) => ({
              category: it.category ?? '未分類',
              itemNo: it.itemNo ?? '',
              name: it.name,
              spec: it.spec ?? '',
              unit: it.unit ?? '',
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            }))
          : [{ ...blankItem }],
      );
    }
  }, [editId, existing.data]);

  const create = trpc.quotation.create.useMutation({
    onSuccess: (q) => {
      void utils.quotation.list.invalidate();
      navigate(`/quotations/${q.id}`);
    },
    onError: (e) => setError(e.message),
  });
  const update = trpc.quotation.update.useMutation({
    onSuccess: () => {
      void utils.quotation.invalidate();
      navigate(`/quotations/${editId}`);
    },
    onError: (e) => setError(e.message),
  });

  if (editId !== null && existing.isLoading) return <Spinner label="載入報價單…" />;

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const discountAmount = Math.round((subtotal * form.discountPercent) / 100);
  const taxBase = subtotal - discountAmount;
  const taxAmount = Math.round((taxBase * form.taxRate) / 100);
  const grandTotal = taxBase + taxAmount;

  const updateItem = (i: number, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const pickClient = (value: string) => {
    if (!value) {
      setForm({ ...form, clientId: '' });
      return;
    }
    const c = (clientOptions.data ?? []).find((x) => String(x.id) === value);
    if (c) {
      setForm({
        ...form,
        clientId: value,
        clientName: c.name,
        clientPhone: c.phone ?? '',
        clientEmail: c.email ?? '',
        clientAddress: c.address ?? '',
      });
    }
  };

  const submit = () => {
    setError('');
    if (!form.projectName.trim()) {
      setError('請輸入報價名稱 / 工程名稱');
      return;
    }
    if (!form.clientName.trim()) {
      setError('請輸入客戶名稱');
      return;
    }
    const payload = {
      projectName: form.projectName,
      description: form.description || null,
      status: form.status,
      quoteDate: form.quoteDate || null,
      validUntil: form.validUntil || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      duration: form.duration || null,
      location: form.location || null,
      clientId: form.clientId ? Number(form.clientId) : null,
      clientName: form.clientName,
      clientContact: form.clientContact || null,
      clientPhone: form.clientPhone || null,
      clientEmail: form.clientEmail || null,
      clientAddress: form.clientAddress || null,
      discountPercent: Number(form.discountPercent),
      taxRate: Number(form.taxRate),
      paymentTerms: form.paymentTerms || null,
      terms: form.terms || null,
      note: form.note || null,
      items: items
        .filter((it) => it.name.trim())
        .map((it) => ({
          category: it.category,
          itemNo: it.itemNo || null,
          name: it.name,
          spec: it.spec || null,
          unit: it.unit || null,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
    };
    if (editId !== null) update.mutate({ id: editId, ...payload });
    else create.mutate(payload);
  };

  return (
    <div>
      <Link
        to={editId !== null ? `/quotations/${editId}` : '/quotations'}
        className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </Link>
      <PageHeader
        title={editId !== null ? '編輯報價單' : '新增報價單'}
        actions={
          <Button loading={create.isPending || update.isPending} onClick={submit}>
            <Save className="h-4 w-4" /> 儲存
          </Button>
        }
      />

      <div className="space-y-3">
        {/* 基本資訊 */}
        <Card>
          <SectionTitle>基本資訊</SectionTitle>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="報價名稱 / 工程名稱" required>
                <Input
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  placeholder="例：XX大樓新建工程"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="工程說明">
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="工程範圍、施工內容等說明"
                />
              </Field>
            </div>
            <Field label="報價日期" required>
              <Input
                type="date"
                value={form.quoteDate}
                onChange={(e) => setForm({ ...form, quoteDate: e.target.value })}
              />
            </Field>
            <Field label="有效期限">
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </Field>
            <Field label="預計開工日">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="預計完工日">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
            <Field label="預計工期">
              <Input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="例：90 工作天"
              />
            </Field>
            <Field label="工程地點">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="施工地址"
              />
            </Field>
          </div>
        </Card>

        {/* 客戶資訊 */}
        <Card>
          <SectionTitle>客戶 / 業主資訊</SectionTitle>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="從客戶資料庫帶入" hint="選擇後將自動填入下方欄位，亦可手動修改">
                <Select value={form.clientId} onChange={(e) => pickClient(e.target.value)}>
                  <option value="">— 不帶入，手動輸入 —</option>
                  {(clientOptions.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="客戶名稱" required>
              <Input
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                placeholder="公司或個人名稱"
              />
            </Field>
            <Field label="聯絡人">
              <Input
                value={form.clientContact}
                onChange={(e) => setForm({ ...form, clientContact: e.target.value })}
                placeholder="聯絡人姓名"
              />
            </Field>
            <Field label="電話">
              <Input
                value={form.clientPhone}
                onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                placeholder="聯絡電話"
              />
            </Field>
            <Field label="Email">
              <Input
                value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                placeholder="電子郵件"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="地址">
                <Input
                  value={form.clientAddress}
                  onChange={(e) => setForm({ ...form, clientAddress: e.target.value })}
                  placeholder="客戶地址"
                />
              </Field>
            </div>
          </div>
        </Card>

        {/* 報價項目明細 */}
        <Card>
          <SectionTitle
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setItems([...items, { ...blankItem }])}
              >
                <Plus className="h-3.5 w-3.5" /> 新增項目
              </Button>
            }
          >
            報價項目明細
          </SectionTitle>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-2 py-2 w-8">#</th>
                  <th className="px-1 py-2 w-28">分類</th>
                  <th className="px-1 py-2">品名</th>
                  <th className="px-1 py-2">規格</th>
                  <th className="px-1 py-2 w-16">單位</th>
                  <th className="px-1 py-2 w-20">數量</th>
                  <th className="px-1 py-2 w-28">單價</th>
                  <th className="px-1 py-2 w-28 text-right">複價</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                    <td className="px-1 py-1.5">
                      <Select
                        value={it.category}
                        onChange={(e) => updateItem(i, { category: e.target.value })}
                      >
                        {ITEM_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        value={it.name}
                        onChange={(e) => updateItem(i, { name: e.target.value })}
                        placeholder="項目名稱"
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        value={it.spec}
                        onChange={(e) => updateItem(i, { spec: e.target.value })}
                        placeholder="規格"
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
                        value={it.quantity}
                        onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
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

            {/* 金額計算 */}
            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">小計</span>
                  <span className="font-medium text-ink">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">折扣</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={form.discountPercent}
                      onChange={(e) =>
                        setForm({ ...form, discountPercent: Number(e.target.value) })
                      }
                      className="w-16 py-1 text-right"
                    />
                    <span className="text-gray-400">%</span>
                    <span className="w-24 text-right text-gray-600">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">營業稅</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={form.taxRate}
                      onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                      className="w-16 py-1 text-right"
                    />
                    <span className="text-gray-400">%</span>
                    <span className="w-24 text-right text-gray-600">
                      +{formatCurrency(taxAmount)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <span className="font-bold text-ink">報價總金額</span>
                  <span className="text-xl font-bold text-brand-600">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 付款條件與備註 */}
        <Card>
          <SectionTitle>付款條件與備註</SectionTitle>
          <div className="space-y-3 p-4">
            <Field label="付款條件">
              <Textarea
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                placeholder="例：簽約30%、開工30%、完工30%、驗收10%"
              />
            </Field>
            <Field label="報價條款">
              <Textarea
                value={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
                className="min-h-28"
              />
            </Field>
            <Field label="備註">
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="其他備註事項"
              />
            </Field>
            <Field label="報價單狀態">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as QuotationStatus })}
                className="max-w-40"
              >
                {QUOTATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {QUOTATION_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(editId !== null ? `/quotations/${editId}` : '/quotations')}
        >
          取消
        </Button>
        <Button loading={create.isPending || update.isPending} onClick={submit}>
          <Save className="h-4 w-4" /> {editId !== null ? '儲存變更' : '建立報價單'}
        </Button>
      </div>
    </div>
  );
}
