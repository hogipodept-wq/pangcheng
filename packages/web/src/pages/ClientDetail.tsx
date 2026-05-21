import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Plus, Star } from 'lucide-react';
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
} from '../components/ui';
import { ProjectStatusBadge } from '../components/status';
import { formatCurrency } from '@pangcheng/shared';

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value || '-'}</p>
    </div>
  );
}

export function ClientDetail() {
  const { id } = useParams();
  const clientId = Number(id);
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.clients.get.useQuery({ id: clientId });

  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    taxId: '',
    type: 'company',
    phone: '',
    email: '',
    address: '',
    note: '',
  });
  const [contact, setContact] = useState({
    name: '',
    title: '',
    phone: '',
    email: '',
    isPrimary: false,
  });

  const update = trpc.clients.update.useMutation({
    onSuccess: () => {
      void utils.clients.get.invalidate({ id: clientId });
      setEditOpen(false);
    },
  });
  const remove = trpc.clients.delete.useMutation({
    onSuccess: () => navigate('/clients'),
  });
  const addContact = trpc.clients.addContact.useMutation({
    onSuccess: () => {
      void utils.clients.get.invalidate({ id: clientId });
      setContactOpen(false);
      setContact({ name: '', title: '', phone: '', email: '', isPrimary: false });
    },
  });
  const delContact = trpc.clients.deleteContact.useMutation({
    onSuccess: () => void utils.clients.get.invalidate({ id: clientId }),
  });

  if (isLoading || !data) return <Spinner label="載入業主資料…" />;

  return (
    <div>
      <Link to="/clients" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> 返回業主列表
      </Link>
      <PageHeader
        title={data.name}
        subtitle={data.type === 'individual' ? '個人業主' : '公司業主'}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setForm({
                  name: data.name,
                  taxId: data.taxId ?? '',
                  type: data.type,
                  phone: data.phone ?? '',
                  email: data.email ?? '',
                  address: data.address ?? '',
                  note: data.note ?? '',
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
            <Info label="聯絡電話" value={data.phone} />
            <Info label="電子郵件" value={data.email} />
            <Info label="地址" value={data.address} />
            <div className="col-span-2">
              <Info label="備註" value={data.note} />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle
            action={
              <Button size="sm" variant="outline" onClick={() => setContactOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> 新增聯絡人
              </Button>
            }
          >
            聯絡人
          </SectionTitle>
          {data.contacts.length === 0 ? (
            <EmptyState title="尚無聯絡人" />
          ) : (
            <div className="divide-y divide-gray-50">
              {data.contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                      {c.name}
                      {c.isPrimary && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                      {c.title && <span className="text-xs text-gray-400">／{c.title}</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.phone || '無電話'} ｜ {c.email || '無信箱'}
                    </p>
                  </div>
                  <button
                    onClick={() => delContact.mutate({ id: c.id })}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-3">
        <SectionTitle>關聯專案</SectionTitle>
        {data.projects.length === 0 ? (
          <EmptyState title="尚無關聯專案" />
        ) : (
          <div className="divide-y divide-gray-50">
            {data.projects.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.code}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{formatCurrency(p.contractAmount)}</span>
                  <ProjectStatusBadge status={p.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* 編輯 */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="編輯業主"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button
              loading={update.isPending}
              onClick={() => update.mutate({ id: clientId, ...form })}
            >
              儲存
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="業主名稱" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="類型">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="company">公司</option>
                <option value="individual">個人</option>
              </Select>
            </Field>
            <Field label="統一編號">
              <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="聯絡電話">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="電子郵件">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field label="地址">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="備註">
            <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
        </div>
      </Modal>

      {/* 新增聯絡人 */}
      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="新增聯絡人"
        footer={
          <>
            <Button variant="outline" onClick={() => setContactOpen(false)}>
              取消
            </Button>
            <Button
              loading={addContact.isPending}
              onClick={() => {
                if (!contact.name.trim()) return;
                addContact.mutate({ clientId, ...contact });
              }}
            >
              新增
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="姓名" required>
              <Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            </Field>
            <Field label="職稱">
              <Input value={contact.title} onChange={(e) => setContact({ ...contact, title: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="電話">
              <Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            </Field>
            <Field label="電子郵件">
              <Input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={contact.isPrimary}
              onChange={(e) => setContact({ ...contact, isPrimary: e.target.checked })}
            />
            設為主要聯絡人
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={delOpen}
        title="刪除業主"
        message={`確定要刪除「${data.name}」嗎？此操作將一併移除其聯絡人資料，且無法復原。`}
        loading={remove.isPending}
        onConfirm={() => remove.mutate({ id: clientId })}
        onClose={() => setDelOpen(false)}
      />
    </div>
  );
}
