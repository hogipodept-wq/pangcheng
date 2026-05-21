import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, KeyRound } from 'lucide-react';
import { trpc } from '../trpc';
import { useAuth } from '../auth';
import {
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  SectionTitle,
  Select,
  Spinner,
  Badge,
  cn,
  type Column,
} from '../components/ui';
import { ROLES, ROLE_LABELS, type Role } from '@pangcheng/shared';

type UserRow = {
  id: number;
  username: string;
  name: string;
  email: string | null;
  role: string;
  active: boolean;
};

function CompanyTab() {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const { data, isLoading } = trpc.companySettings.get.useQuery();
  const [form, setForm] = useState({ name: '', taxId: '', address: '', phone: '', email: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        taxId: data.taxId ?? '',
        address: data.address ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
      });
    }
  }, [data]);

  const update = trpc.companySettings.update.useMutation({
    onSuccess: () => {
      void utils.companySettings.get.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) return <Spinner />;
  const canEdit = user?.role === 'admin';

  return (
    <Card>
      <SectionTitle>公司基本資料</SectionTitle>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <Field label="公司名稱">
          <Input
            value={form.name}
            disabled={!canEdit}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="統一編號">
          <Input
            value={form.taxId}
            disabled={!canEdit}
            onChange={(e) => setForm({ ...form, taxId: e.target.value })}
          />
        </Field>
        <Field label="聯絡電話">
          <Input
            value={form.phone}
            disabled={!canEdit}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label="電子郵件">
          <Input
            value={form.email}
            disabled={!canEdit}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="公司地址">
            <Input
              value={form.address}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
        </div>
      </div>
      {canEdit && (
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-4 py-3">
          {saved && <span className="text-sm text-emerald-600">已儲存</span>}
          <Button loading={update.isPending} onClick={() => update.mutate(form)}>
            儲存設定
          </Button>
        </div>
      )}
    </Card>
  );
}

function UsersTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.user.list.useQuery();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'user' as Role,
    active: true,
  });
  const [error, setError] = useState('');
  const [delTarget, setDelTarget] = useState<UserRow | null>(null);
  const [pwTarget, setPwTarget] = useState<UserRow | null>(null);
  const [newPw, setNewPw] = useState('');

  const create = trpc.user.create.useMutation({
    onSuccess: () => {
      void utils.user.list.invalidate();
      setOpen(false);
    },
    onError: (e) => setError(e.message),
  });
  const update = trpc.user.update.useMutation({
    onSuccess: () => {
      void utils.user.list.invalidate();
      setOpen(false);
    },
    onError: (e) => setError(e.message),
  });
  const remove = trpc.user.delete.useMutation({
    onSuccess: () => {
      void utils.user.list.invalidate();
      setDelTarget(null);
    },
  });
  const resetPw = trpc.user.resetPassword.useMutation({
    onSuccess: () => {
      setPwTarget(null);
      setNewPw('');
    },
  });

  if (isLoading) return <Spinner />;

  const openCreate = () => {
    setEditId(null);
    setForm({ username: '', password: '', name: '', email: '', role: 'user', active: true });
    setError('');
    setOpen(true);
  };
  const openEdit = (u: UserRow) => {
    setEditId(u.id);
    setForm({
      username: u.username,
      password: '',
      name: u.name,
      email: u.email ?? '',
      role: u.role as Role,
      active: u.active,
    });
    setError('');
    setOpen(true);
  };

  const submit = () => {
    setError('');
    if (editId) {
      update.mutate({ id: editId, name: form.name, email: form.email, role: form.role, active: form.active });
    } else {
      if (form.username.length < 3 || form.password.length < 6) {
        setError('帳號至少 3 碼，密碼至少 6 碼');
        return;
      }
      create.mutate({
        username: form.username,
        password: form.password,
        name: form.name,
        email: form.email,
        role: form.role,
      });
    }
  };

  const columns: Column<UserRow>[] = [
    { header: '帳號', render: (r) => <span className="font-mono text-xs">{r.username}</span> },
    { header: '姓名', render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { header: '角色', render: (r) => <Badge tone="blue">{ROLE_LABELS[r.role as Role] ?? r.role}</Badge> },
    {
      header: '狀態',
      render: (r) => (r.active ? <Badge tone="green">啟用</Badge> : <Badge tone="gray">停用</Badge>),
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
            onClick={() => setPwTarget(r)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
          >
            <KeyRound className="h-4 w-4" />
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
    <Card>
      <SectionTitle
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> 新增帳號
          </Button>
        }
      >
        系統使用者
      </SectionTitle>
      <DataTable columns={columns} rows={(data ?? []) as UserRow[]} rowKey={(r) => r.id} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? '編輯帳號' : '新增帳號'}
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
          {!editId && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="帳號" required error={error}>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </Field>
              <Field label="密碼" required>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </Field>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="姓名" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="電子郵件">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="角色">
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </Field>
            {editId && (
              <Field label="帳號狀態">
                <Select
                  value={form.active ? '1' : '0'}
                  onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}
                >
                  <option value="1">啟用</option>
                  <option value="0">停用</option>
                </Select>
              </Field>
            )}
          </div>
          {editId && error && <p className="text-xs text-brand-600">{error}</p>}
        </div>
      </Modal>

      <Modal
        open={!!pwTarget}
        onClose={() => setPwTarget(null)}
        title={`重設「${pwTarget?.name}」的密碼`}
        footer={
          <>
            <Button variant="outline" onClick={() => setPwTarget(null)}>
              取消
            </Button>
            <Button
              loading={resetPw.isPending}
              onClick={() => {
                if (newPw.length < 6 || !pwTarget) return;
                resetPw.mutate({ id: pwTarget.id, newPassword: newPw });
              }}
            >
              重設密碼
            </Button>
          </>
        }
      >
        <Field label="新密碼" required hint="至少 6 碼">
          <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
        </Field>
      </Modal>

      <ConfirmDialog
        open={!!delTarget}
        title="刪除帳號"
        message={`確定要刪除帳號「${delTarget?.name}」嗎？`}
        loading={remove.isPending}
        onConfirm={() => delTarget && remove.mutate({ id: delTarget.id })}
        onClose={() => setDelTarget(null)}
      />
    </Card>
  );
}

function PasswordTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const change = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setDone(true);
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setError('');
    },
    onError: (e) => setError(e.message),
  });

  return (
    <Card>
      <SectionTitle>修改我的密碼</SectionTitle>
      <div className="max-w-md space-y-3 p-4">
        <Field label="目前密碼" required>
          <Input
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          />
        </Field>
        <Field label="新密碼" required hint="至少 6 碼">
          <Input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />
        </Field>
        <Field label="確認新密碼" required error={error}>
          <Input
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
        </Field>
        {done && <p className="text-sm text-emerald-600">密碼已更新</p>}
        <Button
          loading={change.isPending}
          onClick={() => {
            setError('');
            setDone(false);
            if (form.newPassword.length < 6) {
              setError('新密碼至少 6 碼');
              return;
            }
            if (form.newPassword !== form.confirm) {
              setError('兩次輸入的新密碼不一致');
              return;
            }
            change.mutate({
              currentPassword: form.currentPassword,
              newPassword: form.newPassword,
            });
          }}
        >
          更新密碼
        </Button>
      </div>
    </Card>
  );
}

export function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const tabs = isAdmin
    ? (['company', 'users', 'password'] as const)
    : (['company', 'password'] as const);
  const labels: Record<string, string> = {
    company: '公司資料',
    users: '使用者管理',
    password: '修改密碼',
  };
  const [tab, setTab] = useState<string>('company');

  return (
    <div>
      <PageHeader title="系統設定" subtitle="公司資料、帳號與密碼管理" />
      <div className="mb-3 flex flex-wrap gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-ink',
            )}
          >
            {labels[t]}
          </button>
        ))}
      </div>
      {tab === 'company' && <CompanyTab />}
      {tab === 'users' && isAdmin && <UsersTab />}
      {tab === 'password' && <PasswordTab />}
    </div>
  );
}
