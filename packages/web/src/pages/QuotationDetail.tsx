import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { trpc } from '../trpc';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  SectionTitle,
  Select,
  Spinner,
} from '../components/ui';
import { QuotationStatusBadge } from '../components/status';
import {
  formatCurrency,
  formatDate,
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABELS,
  type QuotationStatus,
} from '@pangcheng/shared';

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value || '-'}</p>
    </div>
  );
}

export function QuotationDetail() {
  const { id } = useParams();
  const quotationId = Number(id);
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.quotation.get.useQuery({ id: quotationId });
  const [delOpen, setDelOpen] = useState(false);

  const updateStatus = trpc.quotation.updateStatus.useMutation({
    onSuccess: () => void utils.quotation.invalidate(),
  });
  const remove = trpc.quotation.delete.useMutation({
    onSuccess: () => navigate('/quotations'),
  });

  if (isLoading || !data) return <Spinner label="載入報價單…" />;

  return (
    <div>
      <Link
        to="/quotations"
        className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> 返回報價列表
      </Link>
      <PageHeader
        title={data.projectName}
        subtitle={`報價單號 ${data.code}`}
        actions={
          <>
            <QuotationStatusBadge status={data.status} />
            <Button variant="outline" onClick={() => navigate(`/quotations/${quotationId}/edit`)}>
              <Pencil className="h-4 w-4" /> 編輯
            </Button>
            <Button variant="danger" onClick={() => setDelOpen(true)}>
              <Trash2 className="h-4 w-4" /> 刪除
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle>基本資訊</SectionTitle>
          <div className="grid grid-cols-2 gap-4 p-4 lg:grid-cols-3">
            <Info label="報價日期" value={formatDate(data.quoteDate)} />
            <Info label="有效期限" value={formatDate(data.validUntil)} />
            <Info label="預計工期" value={data.duration} />
            <Info label="預計開工日" value={formatDate(data.startDate)} />
            <Info label="預計完工日" value={formatDate(data.endDate)} />
            <Info label="工程地點" value={data.location} />
            <div className="col-span-2 lg:col-span-3">
              <Info label="工程說明" value={data.description} />
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>客戶資訊</SectionTitle>
          <div className="grid grid-cols-1 gap-4 p-4">
            <Info label="客戶名稱" value={data.clientName} />
            <Info label="聯絡人" value={data.clientContact} />
            <Info label="電話" value={data.clientPhone} />
            <Info label="Email" value={data.clientEmail} />
            <Info label="地址" value={data.clientAddress} />
          </div>
          <div className="border-t border-gray-100 p-4">
            <p className="mb-1.5 text-xs font-medium text-gray-500">變更狀態</p>
            <Select
              value={data.status}
              onChange={(e) =>
                updateStatus.mutate({
                  id: quotationId,
                  status: e.target.value as QuotationStatus,
                })
              }
            >
              {QUOTATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {QUOTATION_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </Card>
      </div>

      <Card className="mt-3">
        <SectionTitle>報價項目明細（{data.items.length}）</SectionTitle>
        {data.items.length === 0 ? (
          <EmptyState title="尚無報價項目" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                <th className="px-4 py-2">分類</th>
                <th className="px-4 py-2">品名</th>
                <th className="px-4 py-2">規格</th>
                <th className="px-4 py-2 text-right">數量</th>
                <th className="px-4 py-2 text-right">單價</th>
                <th className="px-4 py-2 text-right">複價</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it) => (
                <tr key={it.id} className="border-b border-gray-50">
                  <td className="px-4 py-2 text-gray-500">{it.category || '未分類'}</td>
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
          </table>
        )}
        <div className="flex justify-end p-4">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">小計</span>
              <span className="text-ink">{formatCurrency(data.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">折扣（{data.discountPercent}%）</span>
              <span className="text-gray-600">-{formatCurrency(data.discountAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">營業稅（{data.taxRate}%）</span>
              <span className="text-gray-600">+{formatCurrency(data.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1.5">
              <span className="font-bold text-ink">報價總金額</span>
              <span className="text-lg font-bold text-brand-600">
                {formatCurrency(data.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-3">
        <SectionTitle>付款條件與備註</SectionTitle>
        <div className="space-y-3 p-4">
          <Info label="付款條件" value={<span className="whitespace-pre-wrap">{data.paymentTerms}</span>} />
          <Info label="報價條款" value={<span className="whitespace-pre-wrap">{data.terms}</span>} />
          <Info label="備註" value={<span className="whitespace-pre-wrap">{data.note}</span>} />
        </div>
      </Card>

      <ConfirmDialog
        open={delOpen}
        title="刪除報價單"
        message={`確定要刪除報價單「${data.projectName}」嗎？此操作無法復原。`}
        loading={remove.isPending}
        onConfirm={() => remove.mutate({ id: quotationId })}
        onClose={() => setDelOpen(false)}
      />
    </div>
  );
}
