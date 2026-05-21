import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Plus } from 'lucide-react';
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
  cn,
} from '../components/ui';
import { ProjectStatusBadge, ProcurementStatusBadge } from '../components/status';
import {
  formatCurrency,
  formatDate,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PERSONNEL_ROLES,
  PERSONNEL_ROLE_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type ProjectStatus,
  type PersonnelRole,
  type TaskStatus,
} from '@pangcheng/shared';

const TABS = ['overview', 'personnel', 'bidItems', 'tasks', 'procurement'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  overview: '專案概覽',
  personnel: '人員配置',
  bidItems: '標單項目',
  tasks: '工程任務',
  procurement: '採購紀錄',
};

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value || '-'}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn('mt-1 text-lg font-bold', tone ?? 'text-ink')}>{value}</p>
    </Card>
  );
}

export function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.project.get.useQuery({ id: projectId });
  const clients = trpc.clients.list.useQuery();

  const [tab, setTab] = useState<Tab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [personOpen, setPersonOpen] = useState(false);
  const [bidOpen, setBidOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    clientId: '',
    status: 'planning' as ProjectStatus,
    address: '',
    manager: '',
    startDate: '',
    endDate: '',
    contractAmount: 0,
    budgetAmount: 0,
    description: '',
  });
  const [person, setPerson] = useState({ name: '', role: 'engineer' as PersonnelRole, phone: '' });
  const [bid, setBid] = useState({ itemNo: '', name: '', spec: '', unit: '', quantity: 0, unitPrice: 0 });
  const [task, setTask] = useState({
    id: 0,
    name: '',
    status: 'todo' as TaskStatus,
    startDate: '',
    endDate: '',
    progress: 0,
    assignee: '',
  });

  const update = trpc.project.update.useMutation({
    onSuccess: () => {
      void utils.project.get.invalidate({ id: projectId });
      setEditOpen(false);
    },
  });
  const remove = trpc.project.delete.useMutation({ onSuccess: () => navigate('/projects') });
  const addPerson = trpc.project.addPersonnel.useMutation({
    onSuccess: () => {
      void utils.project.get.invalidate({ id: projectId });
      setPersonOpen(false);
      setPerson({ name: '', role: 'engineer', phone: '' });
    },
  });
  const delPerson = trpc.project.deletePersonnel.useMutation({
    onSuccess: () => void utils.project.get.invalidate({ id: projectId }),
  });
  const addBid = trpc.project.addBidItem.useMutation({
    onSuccess: () => {
      void utils.project.get.invalidate({ id: projectId });
      setBidOpen(false);
      setBid({ itemNo: '', name: '', spec: '', unit: '', quantity: 0, unitPrice: 0 });
    },
  });
  const delBid = trpc.project.deleteBidItem.useMutation({
    onSuccess: () => void utils.project.get.invalidate({ id: projectId }),
  });
  const saveTask = trpc.project.saveTask.useMutation({
    onSuccess: () => {
      void utils.project.get.invalidate({ id: projectId });
      setTaskOpen(false);
    },
  });
  const delTask = trpc.project.deleteTask.useMutation({
    onSuccess: () => void utils.project.get.invalidate({ id: projectId }),
  });

  if (isLoading || !data) return <Spinner label="載入專案資料…" />;

  const bidTotal = data.bidItems.reduce((s, b) => s + b.amount, 0);
  const budgetRatio = data.budgetAmount > 0 ? data.spent / data.budgetAmount : 0;

  const openEdit = () => {
    setForm({
      name: data.name,
      clientId: data.clientId ? String(data.clientId) : '',
      status: data.status as ProjectStatus,
      address: data.address ?? '',
      manager: data.manager ?? '',
      startDate: data.startDate ?? '',
      endDate: data.endDate ?? '',
      contractAmount: data.contractAmount,
      budgetAmount: data.budgetAmount,
      description: data.description ?? '',
    });
    setEditOpen(true);
  };

  const openTaskCreate = () => {
    setTask({ id: 0, name: '', status: 'todo', startDate: '', endDate: '', progress: 0, assignee: '' });
    setTaskOpen(true);
  };

  return (
    <div>
      <Link
        to="/projects"
        className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> 返回專案列表
      </Link>
      <PageHeader
        title={data.name}
        subtitle={`${data.code} ｜ ${data.clientName ?? '未指定業主'}`}
        actions={
          <>
            <ProjectStatusBadge status={data.status} />
            <Button variant="outline" onClick={openEdit}>
              <Pencil className="h-4 w-4" /> 編輯
            </Button>
            <Button variant="danger" onClick={() => setDelOpen(true)}>
              <Trash2 className="h-4 w-4" /> 刪除
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="合約金額" value={formatCurrency(data.contractAmount)} />
        <Stat label="預算金額" value={formatCurrency(data.budgetAmount)} />
        <Stat
          label="採購支出"
          value={formatCurrency(data.spent)}
          tone={budgetRatio > 0.9 ? 'text-brand-600' : 'text-ink'}
        />
        <Stat
          label="預算執行率"
          value={`${Math.round(budgetRatio * 100)}%`}
          tone={budgetRatio > 0.9 ? 'text-brand-600' : 'text-ink'}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((t) => (
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
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {tab === 'overview' && (
          <Card>
            <SectionTitle>專案資訊</SectionTitle>
            <div className="grid grid-cols-2 gap-4 p-4 lg:grid-cols-3">
              <Info label="專案經理" value={data.manager} />
              <Info label="工程地址" value={data.address} />
              <Info label="業主" value={data.clientName} />
              <Info label="開工日" value={formatDate(data.startDate)} />
              <Info label="完工日" value={formatDate(data.endDate)} />
              <Info label="建立日期" value={formatDate(data.createdAt)} />
              <div className="col-span-2 lg:col-span-3">
                <Info label="專案說明" value={data.description} />
              </div>
            </div>
          </Card>
        )}

        {tab === 'personnel' && (
          <Card>
            <SectionTitle
              action={
                <Button size="sm" variant="outline" onClick={() => setPersonOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> 新增人員
                </Button>
              }
            >
              人員配置（{data.personnel.length}）
            </SectionTitle>
            {data.personnel.length === 0 ? (
              <EmptyState title="尚未配置人員" />
            ) : (
              <div className="divide-y divide-gray-50">
                {data.personnel.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Badge tone="blue">
                        {PERSONNEL_ROLE_LABELS[p.role as PersonnelRole] ?? p.role}
                      </Badge>
                      <span className="text-sm font-medium text-ink">{p.name}</span>
                      <span className="text-xs text-gray-400">{p.phone}</span>
                    </div>
                    <button
                      onClick={() => delPerson.mutate({ id: p.id })}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'bidItems' && (
          <Card>
            <SectionTitle
              action={
                <Button size="sm" variant="outline" onClick={() => setBidOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> 新增項目
                </Button>
              }
            >
              標單項目（合計 {formatCurrency(bidTotal)}）
            </SectionTitle>
            {data.bidItems.length === 0 ? (
              <EmptyState title="尚無標單項目" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2">項次</th>
                    <th className="px-4 py-2">項目名稱</th>
                    <th className="px-4 py-2">規格</th>
                    <th className="px-4 py-2 text-right">數量</th>
                    <th className="px-4 py-2 text-right">單價</th>
                    <th className="px-4 py-2 text-right">金額</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {data.bidItems.map((b) => (
                    <tr key={b.id} className="border-b border-gray-50">
                      <td className="px-4 py-2 text-gray-500">{b.itemNo || '-'}</td>
                      <td className="px-4 py-2 font-medium text-ink">{b.name}</td>
                      <td className="px-4 py-2 text-gray-500">{b.spec || '-'}</td>
                      <td className="px-4 py-2 text-right">
                        {b.quantity} {b.unit}
                      </td>
                      <td className="px-4 py-2 text-right">{formatCurrency(b.unitPrice)}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCurrency(b.amount)}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => delBid.mutate({ id: b.id })}
                          className="rounded-md p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {tab === 'tasks' && (
          <Card>
            <SectionTitle
              action={
                <Button size="sm" variant="outline" onClick={openTaskCreate}>
                  <Plus className="h-3.5 w-3.5" /> 新增任務
                </Button>
              }
            >
              工程任務（{data.tasks.length}）
            </SectionTitle>
            {data.tasks.length === 0 ? (
              <EmptyState title="尚無任務" />
            ) : (
              <div className="divide-y divide-gray-50">
                {data.tasks.map((t) => (
                  <div key={t.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{t.name}</span>
                        <Badge
                          tone={
                            t.status === 'done'
                              ? 'green'
                              : t.status === 'in_progress'
                                ? 'blue'
                                : t.status === 'blocked'
                                  ? 'red'
                                  : 'gray'
                          }
                        >
                          {TASK_STATUS_LABELS[t.status as TaskStatus] ?? t.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setTask({
                              id: t.id,
                              name: t.name,
                              status: t.status as TaskStatus,
                              startDate: t.startDate ?? '',
                              endDate: t.endDate ?? '',
                              progress: t.progress,
                              assignee: t.assignee ?? '',
                            });
                            setTaskOpen(true);
                          }}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => delTask.mutate({ id: t.id })}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{t.progress}%</span>
                      <span className="text-xs text-gray-400">
                        {formatDate(t.startDate)} ~ {formatDate(t.endDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'procurement' && (
          <Card>
            <SectionTitle>採購紀錄（{data.procurements.length}）</SectionTitle>
            {data.procurements.length === 0 ? (
              <EmptyState title="尚無採購紀錄" />
            ) : (
              <div className="divide-y divide-gray-50">
                {data.procurements.map((p) => (
                  <Link
                    key={p.id}
                    to={`/procurement/${p.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.code}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{formatCurrency(p.totalAmount)}</span>
                      <ProcurementStatusBadge status={p.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* 編輯專案 */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="編輯專案"
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button
              loading={update.isPending}
              onClick={() =>
                update.mutate({
                  id: projectId,
                  name: form.name,
                  clientId: form.clientId ? Number(form.clientId) : null,
                  status: form.status,
                  address: form.address,
                  manager: form.manager,
                  startDate: form.startDate || null,
                  endDate: form.endDate || null,
                  contractAmount: Number(form.contractAmount),
                  budgetAmount: Number(form.budgetAmount),
                  description: form.description,
                })
              }
            >
              儲存
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="專案名稱" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
          </div>
          <Field label="業主">
            <Select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            >
              <option value="">未指定</option>
              {(clients.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="狀態">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="專案經理">
            <Input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
          </Field>
          <Field label="工程地址">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="開工日">
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Field>
          <Field label="完工日">
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </Field>
          <Field label="合約金額">
            <Input
              type="number"
              value={form.contractAmount}
              onChange={(e) => setForm({ ...form, contractAmount: Number(e.target.value) })}
            />
          </Field>
          <Field label="預算金額">
            <Input
              type="number"
              value={form.budgetAmount}
              onChange={(e) => setForm({ ...form, budgetAmount: Number(e.target.value) })}
            />
          </Field>
          <div className="col-span-2">
            <Field label="專案說明">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </Modal>

      {/* 新增人員 */}
      <Modal
        open={personOpen}
        onClose={() => setPersonOpen(false)}
        title="新增專案人員"
        footer={
          <>
            <Button variant="outline" onClick={() => setPersonOpen(false)}>
              取消
            </Button>
            <Button
              loading={addPerson.isPending}
              onClick={() => {
                if (!person.name.trim()) return;
                addPerson.mutate({ projectId, ...person });
              }}
            >
              新增
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="姓名" required>
            <Input value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} />
          </Field>
          <Field label="角色">
            <Select
              value={person.role}
              onChange={(e) => setPerson({ ...person, role: e.target.value as PersonnelRole })}
            >
              {PERSONNEL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {PERSONNEL_ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="電話">
            <Input value={person.phone} onChange={(e) => setPerson({ ...person, phone: e.target.value })} />
          </Field>
        </div>
      </Modal>

      {/* 新增標單項目 */}
      <Modal
        open={bidOpen}
        onClose={() => setBidOpen(false)}
        title="新增標單項目"
        footer={
          <>
            <Button variant="outline" onClick={() => setBidOpen(false)}>
              取消
            </Button>
            <Button
              loading={addBid.isPending}
              onClick={() => {
                if (!bid.name.trim()) return;
                addBid.mutate({ projectId, ...bid });
              }}
            >
              新增
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="項次">
            <Input value={bid.itemNo} onChange={(e) => setBid({ ...bid, itemNo: e.target.value })} />
          </Field>
          <Field label="單位">
            <Input value={bid.unit} onChange={(e) => setBid({ ...bid, unit: e.target.value })} />
          </Field>
          <div className="col-span-2">
            <Field label="項目名稱" required>
              <Input value={bid.name} onChange={(e) => setBid({ ...bid, name: e.target.value })} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="規格">
              <Input value={bid.spec} onChange={(e) => setBid({ ...bid, spec: e.target.value })} />
            </Field>
          </div>
          <Field label="數量">
            <Input
              type="number"
              value={bid.quantity}
              onChange={(e) => setBid({ ...bid, quantity: Number(e.target.value) })}
            />
          </Field>
          <Field label="單價">
            <Input
              type="number"
              value={bid.unitPrice}
              onChange={(e) => setBid({ ...bid, unitPrice: Number(e.target.value) })}
            />
          </Field>
          <div className="col-span-2 text-right text-sm text-gray-500">
            小計：
            <span className="ml-1 font-bold text-ink">
              {formatCurrency(bid.quantity * bid.unitPrice)}
            </span>
          </div>
        </div>
      </Modal>

      {/* 任務 */}
      <Modal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        title={task.id ? '編輯任務' : '新增任務'}
        footer={
          <>
            <Button variant="outline" onClick={() => setTaskOpen(false)}>
              取消
            </Button>
            <Button
              loading={saveTask.isPending}
              onClick={() => {
                if (!task.name.trim()) return;
                saveTask.mutate({
                  id: task.id || undefined,
                  projectId,
                  name: task.name,
                  status: task.status,
                  startDate: task.startDate || null,
                  endDate: task.endDate || null,
                  progress: Number(task.progress),
                  assignee: task.assignee,
                });
              }}
            >
              {task.id ? '儲存' : '新增'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="任務名稱" required>
              <Input value={task.name} onChange={(e) => setTask({ ...task, name: e.target.value })} />
            </Field>
          </div>
          <Field label="狀態">
            <Select
              value={task.status}
              onChange={(e) => setTask({ ...task, status: e.target.value as TaskStatus })}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="進度（%）">
            <Input
              type="number"
              value={task.progress}
              onChange={(e) => setTask({ ...task, progress: Number(e.target.value) })}
            />
          </Field>
          <Field label="開始日">
            <Input
              type="date"
              value={task.startDate}
              onChange={(e) => setTask({ ...task, startDate: e.target.value })}
            />
          </Field>
          <Field label="結束日">
            <Input
              type="date"
              value={task.endDate}
              onChange={(e) => setTask({ ...task, endDate: e.target.value })}
            />
          </Field>
          <div className="col-span-2">
            <Field label="負責人">
              <Input
                value={task.assignee}
                onChange={(e) => setTask({ ...task, assignee: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={delOpen}
        title="刪除專案"
        message={`確定要刪除專案「${data.name}」嗎？此操作將一併移除人員、標單、任務資料，且無法復原。`}
        loading={remove.isPending}
        onConfirm={() => remove.mutate({ id: projectId })}
        onClose={() => setDelOpen(false)}
      />
    </div>
  );
}
