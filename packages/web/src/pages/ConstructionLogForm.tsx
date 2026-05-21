import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Hammer,
  Users,
  Truck,
  Package,
  ClipboardCheck,
  StickyNote,
  Plus,
  Trash2,
  Save,
  FileText,
  type LucideIcon,
} from 'lucide-react';
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
  cn,
} from '../components/ui';
import {
  WEATHER_TYPES,
  WEATHER_LABELS,
  INSPECTION_RESULTS,
  INSPECTION_RESULT_LABELS,
  type WeatherType,
  type InspectionResult,
} from '@pangcheng/shared';

const TABS: { label: string; icon: LucideIcon }[] = [
  { label: '基本資料', icon: ClipboardList },
  { label: '施工項目', icon: Hammer },
  { label: '人力配置', icon: Users },
  { label: '機具使用', icon: Truck },
  { label: '材料進場', icon: Package },
  { label: '自主檢查', icon: ClipboardCheck },
  { label: '備註事項', icon: StickyNote },
];

interface WorkItem { name: string; location: string; quantity: string; unit: string; note: string }
interface LaborItem { trade: string; count: number; note: string }
interface EquipItem { name: string; count: number; hours: string; note: string }
interface MaterialItem { name: string; spec: string; quantity: string; unit: string; supplier: string; note: string }
interface InspItem { category: string; item: string; location: string; result: InspectionResult; inspector: string; note: string }

const today = () => new Date().toISOString().slice(0, 10);

export function ConstructionLogForm() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const projects = trpc.project.list.useQuery();
  const existing = trpc.constructionLog.get.useQuery(
    { id: editId ?? 0 },
    { enabled: editId !== null },
  );

  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [basic, setBasic] = useState({
    projectId: '',
    date: today(),
    weather: 'sunny' as WeatherType,
    temperature: '',
    summary: '',
  });
  const [items, setItems] = useState<WorkItem[]>([]);
  const [labor, setLabor] = useState<LaborItem[]>([]);
  const [equipment, setEquipment] = useState<EquipItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [inspections, setInspections] = useState<InspItem[]>([]);
  const [notes, setNotes] = useState({ content: '', coordinationNotes: '', safetyNotes: '' });

  useEffect(() => {
    if (editId !== null && existing.data) {
      const d = existing.data;
      setBasic({
        projectId: String(d.projectId),
        date: d.date,
        weather: d.weather as WeatherType,
        temperature: d.temperature ?? '',
        summary: d.summary ?? '',
      });
      setItems(d.items as WorkItem[]);
      setLabor(d.labor as LaborItem[]);
      setEquipment(d.equipment as EquipItem[]);
      setMaterials(d.materials as MaterialItem[]);
      setInspections(d.inspections as InspItem[]);
      setNotes({
        content: d.content ?? '',
        coordinationNotes: d.coordinationNotes ?? '',
        safetyNotes: d.safetyNotes ?? '',
      });
    }
  }, [editId, existing.data]);

  const create = trpc.constructionLog.create.useMutation({
    onSuccess: (log) => {
      void utils.constructionLog.invalidate();
      navigate(`/construction-logs/${log.id}`);
    },
    onError: (e) => setError(e.message),
  });
  const update = trpc.constructionLog.update.useMutation({
    onSuccess: () => {
      void utils.constructionLog.invalidate();
      navigate(`/construction-logs/${editId}`);
    },
    onError: (e) => setError(e.message),
  });

  if (editId !== null && existing.isLoading) return <Spinner label="載入施工日誌…" />;

  const totalWorkforce = labor.reduce((s, l) => s + (Number(l.count) || 0), 0);
  const saving = create.isPending || update.isPending;

  const save = (status: 'draft' | 'submitted') => {
    setError('');
    if (!basic.projectId) {
      setTab(0);
      setError('請選擇專案');
      return;
    }
    const payload = {
      projectId: Number(basic.projectId),
      date: basic.date,
      weather: basic.weather,
      temperature: basic.temperature || null,
      summary: basic.summary || null,
      content: notes.content || null,
      coordinationNotes: notes.coordinationNotes || null,
      safetyNotes: notes.safetyNotes || null,
      status,
      items: items.filter((x) => x.name.trim()),
      labor: labor.filter((x) => x.trade.trim()),
      equipment: equipment.filter((x) => x.name.trim()),
      materials: materials.filter((x) => x.name.trim()),
      inspections: inspections.filter((x) => x.item.trim()),
    };
    if (editId !== null) update.mutate({ id: editId, ...payload });
    else create.mutate(payload);
  };

  return (
    <div>
      <Link
        to={editId !== null ? `/construction-logs/${editId}` : '/construction-logs'}
        className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </Link>
      <PageHeader
        title={editId !== null ? '編輯施工日誌' : '新增施工日誌'}
        subtitle="公共工程施工日誌格式"
        actions={
          <>
            <Button variant="outline" loading={saving} onClick={() => save('draft')}>
              <FileText className="h-4 w-4" /> 儲存草稿
            </Button>
            <Button loading={saving} onClick={() => save('submitted')}>
              <Save className="h-4 w-4" /> 儲存
            </Button>
          </>
        }
      />

      {/* 分頁 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              tab === i
                ? 'bg-brand-600 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* 0 基本資料 */}
      {tab === 0 && (
        <Card>
          <SectionTitle>基本資料</SectionTitle>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            <Field label="專案" required error={error}>
              <Select
                value={basic.projectId}
                onChange={(e) => setBasic({ ...basic, projectId: e.target.value })}
              >
                <option value="">選擇專案</option>
                {(projects.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="日期" required>
              <Input
                type="date"
                value={basic.date}
                onChange={(e) => setBasic({ ...basic, date: e.target.value })}
              />
            </Field>
            <Field label="天氣">
              <Select
                value={basic.weather}
                onChange={(e) => setBasic({ ...basic, weather: e.target.value as WeatherType })}
              >
                {WEATHER_TYPES.map((w) => (
                  <option key={w} value={w}>
                    {WEATHER_LABELS[w]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="溫度">
              <Input
                value={basic.temperature}
                onChange={(e) => setBasic({ ...basic, temperature: e.target.value })}
                placeholder="例：25°C"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="今日施工概要">
                <Textarea
                  value={basic.summary}
                  onChange={(e) => setBasic({ ...basic, summary: e.target.value })}
                  placeholder="簡述今日主要施工內容…"
                />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {/* 1 施工項目 */}
      {tab === 1 && (
        <Card>
          <SectionTitle
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setItems([...items, { name: '', location: '', quantity: '', unit: '', note: '' }])
                }
              >
                <Plus className="h-3.5 w-3.5" /> 新增項目
              </Button>
            }
          >
            施工項目
          </SectionTitle>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="px-1 py-2">施工項目</th>
                  <th className="px-1 py-2">施工部位</th>
                  <th className="px-1 py-2 w-24">數量</th>
                  <th className="px-1 py-2 w-20">單位</th>
                  <th className="px-1 py-2">備註</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-sm text-gray-400">尚無施工項目</td></tr>
                )}
                {items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-1 py-1.5"><Input value={it.name} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="如：鋼筋綁紮" /></td>
                    <td className="px-1 py-1.5"><Input value={it.location} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, location: e.target.value } : x))} placeholder="如：B2 樓板" /></td>
                    <td className="px-1 py-1.5"><Input value={it.quantity} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, quantity: e.target.value } : x))} /></td>
                    <td className="px-1 py-1.5"><Input value={it.unit} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} /></td>
                    <td className="px-1 py-1.5"><Input value={it.note} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, note: e.target.value } : x))} /></td>
                    <td className="px-1 py-1.5"><button onClick={() => setItems(items.filter((_, x) => x !== i))} className="rounded-md p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 2 人力配置 */}
      {tab === 2 && (
        <Card>
          <SectionTitle
            action={
              <Button size="sm" variant="outline" onClick={() => setLabor([...labor, { trade: '', count: 0, note: '' }])}>
                <Plus className="h-3.5 w-3.5" /> 新增工種
              </Button>
            }
          >
            人力配置（合計出工 {totalWorkforce} 人）
          </SectionTitle>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="px-1 py-2">工種</th>
                  <th className="px-1 py-2 w-28">人數</th>
                  <th className="px-1 py-2">備註</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {labor.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-gray-400">尚無人力配置</td></tr>
                )}
                {labor.map((it, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-1 py-1.5"><Input value={it.trade} onChange={(e) => setLabor(labor.map((x, idx) => idx === i ? { ...x, trade: e.target.value } : x))} placeholder="如：模板工、鋼筋工" /></td>
                    <td className="px-1 py-1.5"><Input type="number" value={it.count} onChange={(e) => setLabor(labor.map((x, idx) => idx === i ? { ...x, count: Number(e.target.value) } : x))} /></td>
                    <td className="px-1 py-1.5"><Input value={it.note} onChange={(e) => setLabor(labor.map((x, idx) => idx === i ? { ...x, note: e.target.value } : x))} /></td>
                    <td className="px-1 py-1.5"><button onClick={() => setLabor(labor.filter((_, x) => x !== i))} className="rounded-md p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 3 機具使用 */}
      {tab === 3 && (
        <Card>
          <SectionTitle
            action={
              <Button size="sm" variant="outline" onClick={() => setEquipment([...equipment, { name: '', count: 0, hours: '', note: '' }])}>
                <Plus className="h-3.5 w-3.5" /> 新增機具
              </Button>
            }
          >
            機具使用
          </SectionTitle>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="px-1 py-2">機具名稱</th>
                  <th className="px-1 py-2 w-24">數量</th>
                  <th className="px-1 py-2 w-32">使用時數</th>
                  <th className="px-1 py-2">備註</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {equipment.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-sm text-gray-400">尚無機具使用紀錄</td></tr>
                )}
                {equipment.map((it, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-1 py-1.5"><Input value={it.name} onChange={(e) => setEquipment(equipment.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="如：挖土機" /></td>
                    <td className="px-1 py-1.5"><Input type="number" value={it.count} onChange={(e) => setEquipment(equipment.map((x, idx) => idx === i ? { ...x, count: Number(e.target.value) } : x))} /></td>
                    <td className="px-1 py-1.5"><Input value={it.hours} onChange={(e) => setEquipment(equipment.map((x, idx) => idx === i ? { ...x, hours: e.target.value } : x))} placeholder="如：8 小時" /></td>
                    <td className="px-1 py-1.5"><Input value={it.note} onChange={(e) => setEquipment(equipment.map((x, idx) => idx === i ? { ...x, note: e.target.value } : x))} /></td>
                    <td className="px-1 py-1.5"><button onClick={() => setEquipment(equipment.filter((_, x) => x !== i))} className="rounded-md p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 4 材料進場 */}
      {tab === 4 && (
        <Card>
          <SectionTitle
            action={
              <Button size="sm" variant="outline" onClick={() => setMaterials([...materials, { name: '', spec: '', quantity: '', unit: '', supplier: '', note: '' }])}>
                <Plus className="h-3.5 w-3.5" /> 新增材料
              </Button>
            }
          >
            材料進場
          </SectionTitle>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="px-1 py-2">材料名稱</th>
                  <th className="px-1 py-2">規格</th>
                  <th className="px-1 py-2 w-20">數量</th>
                  <th className="px-1 py-2 w-16">單位</th>
                  <th className="px-1 py-2">供應廠商</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-sm text-gray-400">尚無材料進場紀錄</td></tr>
                )}
                {materials.map((it, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-1 py-1.5"><Input value={it.name} onChange={(e) => setMaterials(materials.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="如：預拌混凝土" /></td>
                    <td className="px-1 py-1.5"><Input value={it.spec} onChange={(e) => setMaterials(materials.map((x, idx) => idx === i ? { ...x, spec: e.target.value } : x))} /></td>
                    <td className="px-1 py-1.5"><Input value={it.quantity} onChange={(e) => setMaterials(materials.map((x, idx) => idx === i ? { ...x, quantity: e.target.value } : x))} /></td>
                    <td className="px-1 py-1.5"><Input value={it.unit} onChange={(e) => setMaterials(materials.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} /></td>
                    <td className="px-1 py-1.5"><Input value={it.supplier} onChange={(e) => setMaterials(materials.map((x, idx) => idx === i ? { ...x, supplier: e.target.value } : x))} /></td>
                    <td className="px-1 py-1.5"><button onClick={() => setMaterials(materials.filter((_, x) => x !== i))} className="rounded-md p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5 自主檢查 */}
      {tab === 5 && (
        <Card>
          <SectionTitle
            action={
              <Button size="sm" variant="outline" onClick={() => setInspections([...inspections, { category: '', item: '', location: '', result: 'pass', inspector: '', note: '' }])}>
                <Plus className="h-3.5 w-3.5" /> 新增檢查項目
              </Button>
            }
          >
            自主檢查
          </SectionTitle>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="px-1 py-2">檢查類別</th>
                  <th className="px-1 py-2">檢查項目</th>
                  <th className="px-1 py-2">檢查部位</th>
                  <th className="px-1 py-2 w-28">結果</th>
                  <th className="px-1 py-2">檢查人員</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {inspections.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-sm text-gray-400">尚無自主檢查項目</td></tr>
                )}
                {inspections.map((it, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-1 py-1.5"><Input value={it.category} onChange={(e) => setInspections(inspections.map((x, idx) => idx === i ? { ...x, category: e.target.value } : x))} placeholder="如：鋼筋工程" /></td>
                    <td className="px-1 py-1.5"><Input value={it.item} onChange={(e) => setInspections(inspections.map((x, idx) => idx === i ? { ...x, item: e.target.value } : x))} placeholder="檢查項目" /></td>
                    <td className="px-1 py-1.5"><Input value={it.location} onChange={(e) => setInspections(inspections.map((x, idx) => idx === i ? { ...x, location: e.target.value } : x))} /></td>
                    <td className="px-1 py-1.5">
                      <Select value={it.result} onChange={(e) => setInspections(inspections.map((x, idx) => idx === i ? { ...x, result: e.target.value as InspectionResult } : x))}>
                        {INSPECTION_RESULTS.map((r) => (
                          <option key={r} value={r}>{INSPECTION_RESULT_LABELS[r]}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-1 py-1.5"><Input value={it.inspector} onChange={(e) => setInspections(inspections.map((x, idx) => idx === i ? { ...x, inspector: e.target.value } : x))} /></td>
                    <td className="px-1 py-1.5"><button onClick={() => setInspections(inspections.filter((_, x) => x !== i))} className="rounded-md p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-gray-400">
              提示：自主檢查照片可於日誌儲存後，在日誌明細頁上傳。
            </p>
          </div>
        </Card>
      )}

      {/* 6 備註事項 */}
      {tab === 6 && (
        <Card>
          <SectionTitle>備註事項</SectionTitle>
          <div className="space-y-3 p-4">
            <Field label="重要事項記錄">
              <Textarea
                value={notes.content}
                onChange={(e) => setNotes({ ...notes, content: e.target.value })}
                placeholder="今日重要事項、進度說明…"
              />
            </Field>
            <Field label="協調事項 / 監造指示">
              <Textarea
                value={notes.coordinationNotes}
                onChange={(e) => setNotes({ ...notes, coordinationNotes: e.target.value })}
                placeholder="與業主、監造單位之協調事項…"
              />
            </Field>
            <Field label="工安事項">
              <Textarea
                value={notes.safetyNotes}
                onChange={(e) => setNotes({ ...notes, safetyNotes: e.target.value })}
                placeholder="工地安全衛生事項、缺失與改善…"
              />
            </Field>
          </div>
        </Card>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>
      )}
    </div>
  );
}
