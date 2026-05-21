import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  DollarSign,
  ClipboardList,
  Plus,
  Trash2,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { trpc } from '../trpc';
import {
  Button,
  Card,
  Field,
  Input,
  SectionTitle,
  Select,
  Textarea,
  cn,
} from '../components/ui';
import {
  formatCurrency,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PERSONNEL_ROLES,
  PERSONNEL_ROLE_LABELS,
  type ProjectStatus,
  type PersonnelRole,
} from '@pangcheng/shared';

const PROJECT_TYPES = [
  '新建工程',
  '增建工程',
  '改建工程',
  '修繕工程',
  '室內裝修',
  '結構補強',
  '拆除工程',
  '其他',
];

const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: '基本資料', icon: Building2 },
  { label: '人員配置', icon: Users },
  { label: '契約金額', icon: DollarSign },
  { label: '標單匯入', icon: ClipboardList },
];

interface PersonRow {
  role: PersonnelRole;
  name: string;
  phone: string;
  license: string;
  note: string;
}
interface BidRow {
  itemNo: string;
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export function ProjectWizard() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const clients = trpc.clients.list.useQuery();
  const staff = trpc.staff.list.useQuery();

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    projectType: '',
    clientId: '',
    clientContactInfo: '',
    designUnit: '',
    supervisionUnit: '',
    status: 'planning' as ProjectStatus,
    address: '',
    manager: '',
    startDate: '',
    endDate: '',
    duration: '',
    contractAmount: 0,
    budgetAmount: 0,
    description: '',
  });
  const [personnel, setPersonnel] = useState<PersonRow[]>([]);
  const [bidItems, setBidItems] = useState<BidRow[]>([]);

  const create = trpc.project.create.useMutation({
    onSuccess: (created) => {
      void utils.project.list.invalidate();
      navigate(`/projects/${created.id}`);
    },
    onError: (e) => setError(e.message),
  });

  const bidTotal = bidItems.reduce((s, b) => s + b.quantity * b.unitPrice, 0);

  const next = () => {
    setError('');
    if (step === 0 && !form.name.trim()) {
      setError('請輸入工程名稱');
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };
  const prev = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = () => {
    setError('');
    if (!form.name.trim()) {
      setStep(0);
      setError('請輸入工程名稱');
      return;
    }
    create.mutate({
      name: form.name,
      code: form.code || null,
      projectType: form.projectType || null,
      clientId: form.clientId ? Number(form.clientId) : null,
      clientContactInfo: form.clientContactInfo || null,
      designUnit: form.designUnit || null,
      supervisionUnit: form.supervisionUnit || null,
      status: form.status,
      address: form.address || null,
      manager: form.manager || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      duration: form.duration || null,
      contractAmount: Number(form.contractAmount),
      budgetAmount: Number(form.budgetAmount),
      description: form.description || null,
      personnel: personnel
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name,
          role: p.role,
          phone: p.phone || null,
          license: p.license || null,
          note: p.note || null,
        })),
      bidItems: bidItems
        .filter((b) => b.name.trim())
        .map((b) => ({
          itemNo: b.itemNo || null,
          name: b.name,
          spec: b.spec || null,
          unit: b.unit || null,
          quantity: Number(b.quantity),
          unitPrice: Number(b.unitPrice),
        })),
    });
  };

  return (
    <div>
      <Link
        to="/projects"
        className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> 返回專案列表
      </Link>
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-bold text-ink">建立專案</h1>
      </div>
      <p className="mb-5 text-sm text-gray-500">依照步驟填寫專案資料，最後可匯入標單</p>

      {/* 步驟列 */}
      <div className="mb-5 flex items-center justify-center">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                    active || done ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400',
                  )}
                >
                  {done ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-xs font-medium',
                    active ? 'text-brand-600' : done ? 'text-ink' : 'text-gray-400',
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 w-16 sm:w-28',
                    done ? 'bg-brand-600' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 步驟 1：基本資料 */}
      {step === 0 && (
        <div className="space-y-3">
          <Card>
            <SectionTitle>工程基本資料</SectionTitle>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              <Field label="工程名稱" required error={error}>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：台北市信義區大樓新建工程"
                />
              </Field>
              <Field label="專案編號" hint="留空將自動產生">
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="例：P2026-001"
                />
              </Field>
              <Field label="工程類型">
                <Select
                  value={form.projectType}
                  onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                >
                  <option value="">未選擇</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
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
              <Field label="業主機關 / 委託單位">
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
              <Field label="業主聯絡方式">
                <Input
                  value={form.clientContactInfo}
                  onChange={(e) => setForm({ ...form, clientContactInfo: e.target.value })}
                  placeholder="電話或 Email"
                />
              </Field>
              <Field label="設計單位">
                <Input
                  value={form.designUnit}
                  onChange={(e) => setForm({ ...form, designUnit: e.target.value })}
                  placeholder="建築師事務所 / 設計公司"
                />
              </Field>
              <Field label="監造單位">
                <Input
                  value={form.supervisionUnit}
                  onChange={(e) => setForm({ ...form, supervisionUnit: e.target.value })}
                  placeholder="監造公司"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="專案地址">
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="工程地址"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="工程概要描述">
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="簡述工程範圍、規模、特殊需求…"
                  />
                </Field>
              </div>
            </div>
          </Card>
          <Card>
            <SectionTitle>時程資訊</SectionTitle>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
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
            </div>
          </Card>
        </div>
      )}

      {/* 步驟 2：人員配置 */}
      {step === 1 && (
        <Card>
          <SectionTitle
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setPersonnel([
                    ...personnel,
                    { role: 'site_manager', name: '', phone: '', license: '', note: '' },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> 新增人員
              </Button>
            }
          >
            專案人員配置
          </SectionTitle>
          <div className="space-y-3 p-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-1.5 text-sm font-medium text-gray-600">指派專案經理 (PM)</p>
              <Select
                value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}
                className="max-w-xs"
              >
                <option value="">未指派</option>
                {(staff.data ?? []).map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>

            {personnel.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">
                尚未配置人員，點擊右上角「新增人員」加入
              </p>
            )}

            {personnel.map((p, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {PERSONNEL_ROLE_LABELS[p.role]}
                  </span>
                  <button
                    onClick={() => setPersonnel(personnel.filter((_, x) => x !== i))}
                    className="rounded-md p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="職務角色">
                    <Select
                      value={p.role}
                      onChange={(e) =>
                        setPersonnel(
                          personnel.map((x, idx) =>
                            idx === i ? { ...x, role: e.target.value as PersonnelRole } : x,
                          ),
                        )
                      }
                    >
                      {PERSONNEL_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {PERSONNEL_ROLE_LABELS[r]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="姓名">
                    <Input
                      value={p.name}
                      onChange={(e) =>
                        setPersonnel(
                          personnel.map((x, idx) =>
                            idx === i ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="輸入姓名"
                    />
                  </Field>
                  <Field label="聯絡電話">
                    <Input
                      value={p.phone}
                      onChange={(e) =>
                        setPersonnel(
                          personnel.map((x, idx) =>
                            idx === i ? { ...x, phone: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="手機或分機"
                    />
                  </Field>
                  <Field label="相關證照">
                    <Input
                      value={p.license}
                      onChange={(e) =>
                        setPersonnel(
                          personnel.map((x, idx) =>
                            idx === i ? { ...x, license: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="例：甲種勞安衛生管理員"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="備註">
                      <Input
                        value={p.note}
                        onChange={(e) =>
                          setPersonnel(
                            personnel.map((x, idx) =>
                              idx === i ? { ...x, note: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="其他說明"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 步驟 3：契約金額 */}
      {step === 2 && (
        <Card>
          <SectionTitle>契約與預算金額</SectionTitle>
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="合約金額" hint="與業主簽訂的工程合約總價">
                <Input
                  type="number"
                  value={form.contractAmount}
                  onChange={(e) => setForm({ ...form, contractAmount: Number(e.target.value) })}
                />
              </Field>
              <Field label="預算金額" hint="本案預計投入的成本預算">
                <Input
                  type="number"
                  value={form.budgetAmount}
                  onChange={(e) => setForm({ ...form, budgetAmount: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">預估毛利（合約 − 預算）</span>
              <span
                className={cn(
                  'text-lg font-bold',
                  form.contractAmount - form.budgetAmount >= 0
                    ? 'text-emerald-600'
                    : 'text-brand-600',
                )}
              >
                {formatCurrency(form.contractAmount - form.budgetAmount)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* 步驟 4：標單匯入 */}
      {step === 3 && (
        <Card>
          <SectionTitle
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setBidItems([
                    ...bidItems,
                    { itemNo: '', name: '', spec: '', unit: '', quantity: 1, unitPrice: 0 },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> 新增項目
              </Button>
            }
          >
            標單項目（可留空，日後於專案中補登）
          </SectionTitle>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="px-1 py-2 w-20">項次</th>
                  <th className="px-1 py-2">項目名稱</th>
                  <th className="px-1 py-2">規格</th>
                  <th className="px-1 py-2 w-16">單位</th>
                  <th className="px-1 py-2 w-20">數量</th>
                  <th className="px-1 py-2 w-28">單價</th>
                  <th className="px-1 py-2 w-28 text-right">複價</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {bidItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-gray-400">
                      尚無標單項目
                    </td>
                  </tr>
                )}
                {bidItems.map((b, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-1 py-1.5">
                      <Input
                        value={b.itemNo}
                        onChange={(e) =>
                          setBidItems(
                            bidItems.map((x, idx) =>
                              idx === i ? { ...x, itemNo: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        value={b.name}
                        onChange={(e) =>
                          setBidItems(
                            bidItems.map((x, idx) =>
                              idx === i ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="項目名稱"
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        value={b.spec}
                        onChange={(e) =>
                          setBidItems(
                            bidItems.map((x, idx) =>
                              idx === i ? { ...x, spec: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        value={b.unit}
                        onChange={(e) =>
                          setBidItems(
                            bidItems.map((x, idx) =>
                              idx === i ? { ...x, unit: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        type="number"
                        value={b.quantity}
                        onChange={(e) =>
                          setBidItems(
                            bidItems.map((x, idx) =>
                              idx === i ? { ...x, quantity: Number(e.target.value) } : x,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input
                        type="number"
                        value={b.unitPrice}
                        onChange={(e) =>
                          setBidItems(
                            bidItems.map((x, idx) =>
                              idx === i ? { ...x, unitPrice: Number(e.target.value) } : x,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right font-medium text-ink">
                      {formatCurrency(b.quantity * b.unitPrice)}
                    </td>
                    <td className="px-1 py-1.5">
                      <button
                        onClick={() => setBidItems(bidItems.filter((_, x) => x !== i))}
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
              <span className="text-sm text-gray-500">標單總金額</span>
              <span className="text-xl font-bold text-brand-600">{formatCurrency(bidTotal)}</span>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>
      )}

      {/* 操作列 */}
      <div className="mt-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/projects')}>
          取消
        </Button>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={prev}>
              上一步
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={next}>下一步</Button>
          ) : (
            <Button loading={create.isPending} onClick={submit}>
              建立專案
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
