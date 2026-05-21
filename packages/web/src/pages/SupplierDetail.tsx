import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Plus, FileText, ExternalLink } from 'lucide-react';
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
  Textarea,
  Badge,
} from '../components/ui';
import { RatingStars } from './Suppliers';
import { uploadFile } from '../lib/upload';
import {
  TRADE_CATEGORIES,
  TRADE_CATEGORY_LABELS,
  SUPPLIER_FILE_TYPES,
  SUPPLIER_FILE_TYPE_LABELS,
  formatDate,
  type TradeCategory,
  type SupplierFileType,
} from '@pangcheng/shared';

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value || '-'}</p>
    </div>
  );
}

export function SupplierDetail() {
  const { id } = useParams();
  const supplierId = Number(id);
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.supplier.get.useQuery({ id: supplierId });

  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [form, setForm] = useState({
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
  });
  const [fileForm, setFileForm] = useState({
    fileType: 'registration' as SupplierFileType,
    name: '',
    expiryDate: '',
  });
  const [picked, setPicked] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');

  const update = trpc.supplier.update.useMutation({
    onSuccess: () => {
      void utils.supplier.get.invalidate({ id: supplierId });
      setEditOpen(false);
    },
  });
  const remove = trpc.supplier.delete.useMutation({ onSuccess: () => navigate('/suppliers') });
  const addFile = trpc.supplier.addFile.useMutation({
    onSuccess: () => {
      void utils.supplier.get.invalidate({ id: supplierId });
      setFileOpen(false);
      setPicked(null);
      setFileForm({ fileType: 'registration', name: '', expiryDate: '' });
    },
  });
  const delFile = trpc.supplier.deleteFile.useMutation({
    onSuccess: () => void utils.supplier.get.invalidate({ id: supplierId }),
  });

  if (isLoading || !data) return <Spinner label="載入廠商資料…" />;

  const submitFile = async () => {
    setFileError('');
    if (!picked) {
      setFileError('請選擇要上傳的檔案');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(picked);
      addFile.mutate({
        supplierId,
        fileType: fileForm.fileType,
        name: fileForm.name.trim() || result.name,
        fileUrl: result.url,
        expiryDate: fileForm.expiryDate || null,
      });
    } catch (e) {
      setFileError(e instanceof Error ? e.message : '上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Link
        to="/suppliers"
        className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> 返回廠商列表
      </Link>
      <PageHeader
        title={data.name}
        subtitle={TRADE_CATEGORY_LABELS[data.tradeCategory as TradeCategory] ?? data.tradeCategory}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setForm({
                  name: data.name,
                  taxId: data.taxId ?? '',
                  tradeCategory: data.tradeCategory as TradeCategory,
                  contactPerson: data.contactPerson ?? '',
                  phone: data.phone ?? '',
                  email: data.email ?? '',
                  address: data.address ?? '',
                  rating: data.rating,
                  note: data.note ?? '',
                  active: data.active,
                });
                setEditOpen(true);
              }}
            >
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
          <SectionTitle>基本資料</SectionTitle>
          <div className="grid grid-cols-2 gap-4 p-4">
            <Info label="統一編號" value={data.taxId} />
            <Info label="聯絡人" value={data.contactPerson} />
            <Info label="電話" value={data.phone} />
            <Info label="電子郵件" value={data.email} />
            <Info label="評鑑" value={<RatingStars value={data.rating} />} />
            <Info
              label="合作狀態"
              value={
                data.active ? <Badge tone="green">合作中</Badge> : <Badge tone="gray">停用</Badge>
              }
            />
            <div className="col-span-2">
              <Info label="地址" value={data.address} />
            </div>
            <div className="col-span-2">
              <Info label="備註" value={data.note} />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle
            action={
              <Button size="sm" variant="outline" onClick={() => setFileOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> 上傳文件
              </Button>
            }
          >
            廠商文件（營登／合約／保險）
          </SectionTitle>
          {data.files.length === 0 ? (
            <EmptyState title="尚無上傳文件" />
          ) : (
            <div className="divide-y divide-gray-50">
              {data.files.map((f) => (
                <div key={f.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                      <FileText className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{f.name}</p>
                      <p className="text-xs text-gray-400">
                        {SUPPLIER_FILE_TYPE_LABELS[f.fileType as SupplierFileType] ?? f.fileType}
                        {f.expiryDate && ` ｜ 有效期至 ${formatDate(f.expiryDate)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={f.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => delFile.mutate({ id: f.id })}
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

      {/* 編輯廠商 */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="編輯廠商"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button
              loading={update.isPending}
              onClick={() => update.mutate({ id: supplierId, ...form })}
            >
              儲存
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="廠商名稱" required>
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
            <Field label="評鑑">
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
            <Field label="合作狀態">
              <Select
                value={form.active ? '1' : '0'}
                onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}
              >
                <option value="1">合作中</option>
                <option value="0">停用</option>
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

      {/* 上傳文件 */}
      <Modal
        open={fileOpen}
        onClose={() => setFileOpen(false)}
        title="上傳廠商文件"
        footer={
          <>
            <Button variant="outline" onClick={() => setFileOpen(false)}>
              取消
            </Button>
            <Button loading={uploading || addFile.isPending} onClick={() => void submitFile()}>
              上傳
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="文件類型">
            <Select
              value={fileForm.fileType}
              onChange={(e) =>
                setFileForm({ ...fileForm, fileType: e.target.value as SupplierFileType })
              }
            >
              {SUPPLIER_FILE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SUPPLIER_FILE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="文件名稱" hint="留空則使用檔案原始名稱">
            <Input
              value={fileForm.name}
              onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
            />
          </Field>
          <Field label="有效期限">
            <Input
              type="date"
              value={fileForm.expiryDate}
              onChange={(e) => setFileForm({ ...fileForm, expiryDate: e.target.value })}
            />
          </Field>
          <Field label="選擇檔案" required error={fileError}>
            <Input type="file" onChange={(e) => setPicked(e.target.files?.[0] ?? null)} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={delOpen}
        title="刪除廠商"
        message={`確定要刪除「${data.name}」嗎？此操作將一併移除其文件，且無法復原。`}
        loading={remove.isPending}
        onConfirm={() => remove.mutate({ id: supplierId })}
        onClose={() => setDelOpen(false)}
      />
    </div>
  );
}
