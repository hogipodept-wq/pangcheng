import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Plus, Check } from 'lucide-react';
import { trpc } from '../trpc';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SectionTitle,
  Select,
  Spinner,
} from '../components/ui';
import { ProcurementStatusBadge } from '../components/status';
import {
  formatCurrency,
  formatDate,
  PROCUREMENT_STATUSES,
  PROCUREMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type ProcurementStatus,
  type PaymentMethod,
} from '@pangcheng/shared';

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value || '-'}</p>
    </div>
  );
}

export function ProcurementDetail() {
  const { id } = useParams();
  const procurementId = Number(id);
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.procurement.get.useQuery({ id: procurementId });

  const [delOpen, setDelOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const suppliers = trpc.supplier.list.useQuery();
  const [quote, setQuote] = useState({ supplierId: '', supplierName: '', quoteAmount: 0, quoteDate: '' });

  const updateStatus = trpc.procurement.updateStatus.useMutation({
    onSuccess: () => void utils.procurement.invalidate(),
  });
  const remove = trpc.procurement.delete.useMutation({
    onSuccess: () => navigate('/procurement'),
  });
  const addQuote = trpc.procurement.addQuote.useMutation({
    onSuccess: () => {
      void utils.procurement.get.invalidate({ id: procurementId });
      setQuoteOpen(false);
      setQuote({ supplierId: '', supplierName: '', quoteAmount: 0, quoteDate: '' });
    },
  });
  const selectQuote = trpc.procurement.selectQuote.useMutation({
    onSuccess: () => void utils.procurement.get.invalidate({ id: procurementId }),
  });
  const delQuote = trpc.procurement.deleteQuote.useMutation({
    onSuccess: () => void utils.procurement.get.invalidate({ id: procurementId }),
  });

  if (isLoading || !data) return <Spinner label="載入採購單…" />;

  return (
    <div>
      <Link
        to="/procurement"
        className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> 返回採購列表
      </Link>
      <PageHeader
        title={data.title}
        subtitle={`採購單號 ${data.code}`}
        actions={
          <>
            <ProcurementStatusBadge status={data.status} />
            <Button variant="outline" onClick={() => navigate(`/procurement/${procurementId}/edit`)}>
              <Pencil className="h-4 w-4" /> 編輯
            </Button>
            <Button variant="danger" onClick={() => setDelOpen(true)}>
              <Trash2 className="h-4 w-4" /> 刪除
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <SectionTitle>採購資訊</SectionTitle>
          <div className="grid grid-cols-2 gap-4 p-4">
            <Info
              label="所屬專案"
              value={
                data.projectId ? (
                  <Link to={`/projects/${data.projectId}`} className="text-brand-600 hover:underline">
                    {data.projectName}
                  </Link>
                ) : (
                  '-'
                )
              }
            />
            <Info
              label="供應廠商"
              value={
                data.supplierId ? (
                  <Link to={`/suppliers/${data.supplierId}`} className="text-brand-600 hover:underline">
                    {data.supplierName}
                  </Link>
                ) : (
                  '-'
                )
              }
            />
            <Info label="請購人" value={data.requestedBy} />
            <Info
              label="付款方式"
              value={PAYMENT_METHOD_LABELS[data.paymentMethod as PaymentMethod] ?? data.paymentMethod}
            />
            <Info label="請購日" value={formatDate(data.requestDate)} />
            <Info label="期望到貨" value={formatDate(data.expectedDate)} />
            <Info label="收貨日" value={formatDate(data.receivedDate)} />
            <Info label="總金額" value={<span className="font-bold text-brand-600">{formatCurrency(data.totalAmount)}</span>} />
            <div className="col-span-2">
              <Info label="備註" value={data.note} />
            </div>
          </div>
          <div className="border-t border-gray-100 p-4">
            <p className="mb-1.5 text-xs font-medium text-gray-500">變更狀態</p>
            <Select
              value={data.status}
              onChange={(e) =>
                updateStatus.mutate({
                  id: procurementId,
                  status: e.target.value as ProcurementStatus,
                })
              }
            >
              {PROCUREMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROCUREMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <div className="space-y-3 lg:col-span-2">
          <Card>
            <SectionTitle>採購品項（{data.items.length}）</SectionTitle>
            {data.items.length === 0 ? (
              <EmptyState title="尚無採購品項" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2">品項</th>
                    <th className="px-4 py-2">規格</th>
                    <th className="px-4 py-2 text-right">數量</th>
                    <th className="px-4 py-2 text-right">單價</th>
                    <th className="px-4 py-2 text-right">小計</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((it) => (
                    <tr key={it.id} className="border-b border-gray-50">
                      <td className="px-4 py-2 font-medium text-ink">{it.name}</td>
                      <td className="px-4 py-2 text-gray-500">{it.spec || '-'}</td>
                      <td className="px-4 py-2 text-right">
                        {it.quantity} {it.unit}
                      </td>
                      <td className="px-4 py-2 text-right">{formatCurrency(it.unitPrice)}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCurrency(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                      總金額
                    </td>
                    <td className="px-4 py-2 text-right text-base font-bold text-brand-600">
                      {formatCurrency(data.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </Card>

          <Card>
            <SectionTitle
              action={
                <Button size="sm" variant="outline" onClick={() => setQuoteOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> 新增報價
                </Button>
              }
            >
              廠商比價（{data.quotes.length}）
            </SectionTitle>
            {data.quotes.length === 0 ? (
              <EmptyState title="尚無廠商報價" description="可新增多家廠商報價進行比較" />
            ) : (
              <div className="divide-y divide-gray-50">
                {data.quotes.map((q) => (
                  <div
                    key={q.id}
                    className={`flex items-center justify-between px-4 py-3 ${q.selected ? 'bg-emerald-50/50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {q.selected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-medium text-ink">{q.supplierName}</p>
                        <p className="text-xs text-gray-400">{formatDate(q.quoteDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-ink">
                        {formatCurrency(q.quoteAmount)}
                      </span>
                      {!q.selected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            selectQuote.mutate({ id: q.id, procurementId })
                          }
                        >
                          選用
                        </Button>
                      )}
                      <button
                        onClick={() => delQuote.mutate({ id: q.id })}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 新增報價 */}
      <Modal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        title="新增廠商報價"
        footer={
          <>
            <Button variant="outline" onClick={() => setQuoteOpen(false)}>
              取消
            </Button>
            <Button
              loading={addQuote.isPending}
              onClick={() => {
                const supplier = (suppliers.data ?? []).find(
                  (s) => String(s.id) === quote.supplierId,
                );
                const name = supplier?.name ?? quote.supplierName;
                if (!name.trim()) return;
                addQuote.mutate({
                  procurementId,
                  supplierId: supplier?.id ?? null,
                  supplierName: name,
                  quoteAmount: Number(quote.quoteAmount),
                  quoteDate: quote.quoteDate || null,
                });
              }}
            >
              新增
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="選擇廠商" hint="若為名單外廠商，請於下方手動輸入名稱">
            <Select
              value={quote.supplierId}
              onChange={(e) => setQuote({ ...quote, supplierId: e.target.value })}
            >
              <option value="">— 手動輸入 —</option>
              {(suppliers.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          {!quote.supplierId && (
            <Field label="廠商名稱" required>
              <Input
                value={quote.supplierName}
                onChange={(e) => setQuote({ ...quote, supplierName: e.target.value })}
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="報價金額">
              <Input
                type="number"
                value={quote.quoteAmount}
                onChange={(e) => setQuote({ ...quote, quoteAmount: Number(e.target.value) })}
              />
            </Field>
            <Field label="報價日期">
              <Input
                type="date"
                value={quote.quoteDate}
                onChange={(e) => setQuote({ ...quote, quoteDate: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={delOpen}
        title="刪除採購單"
        message={`確定要刪除採購單「${data.title}」嗎？此操作無法復原。`}
        loading={remove.isPending}
        onConfirm={() => remove.mutate({ id: procurementId })}
        onClose={() => setDelOpen(false)}
      />
    </div>
  );
}
