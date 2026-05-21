import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { trpc } from '../trpc';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Textarea,
  Badge,
  type Column,
} from '../components/ui';
import { formatDate, WEATHER_TYPES, WEATHER_LABELS, type WeatherType } from '@pangcheng/shared';

type LogRow = {
  id: number;
  projectId: number;
  date: string;
  weather: string;
  temperature: string | null;
  workforce: number;
  summary: string | null;
  recordedBy: string | null;
  projectName: string | null;
};

export function ConstructionLogs() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.constructionLog.list.useQuery();
  const projects = trpc.project.list.useQuery();
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectId: '',
    date: new Date().toISOString().slice(0, 10),
    weather: 'sunny' as WeatherType,
    temperature: '',
    workforce: 0,
    summary: '',
    content: '',
  });

  const create = trpc.constructionLog.create.useMutation({
    onSuccess: (created) => {
      void utils.constructionLog.list.invalidate();
      setOpen(false);
      navigate(`/construction-logs/${created.id}`);
    },
    onError: (e) => setError(e.message),
  });

  const rows = useMemo(() => {
    const list = (data ?? []) as LogRow[];
    const k = keyword.trim();
    if (!k) return list;
    return list.filter(
      (l) => (l.summary ?? '').includes(k) || (l.projectName ?? '').includes(k),
    );
  }, [data, keyword]);

  const columns: Column<LogRow>[] = [
    { header: '日期', render: (r) => formatDate(r.date) },
    { header: '專案', render: (r) => <span className="font-medium text-ink">{r.projectName}</span> },
    {
      header: '天氣',
      render: (r) => <Badge tone="blue">{WEATHER_LABELS[r.weather as WeatherType] ?? r.weather}</Badge>,
    },
    { header: '出工人數', render: (r) => `${r.workforce} 人`, align: 'right' },
    { header: '工作摘要', render: (r) => r.summary || '-', className: 'max-w-sm truncate' },
    { header: '記錄人', render: (r) => r.recordedBy || '-' },
  ];

  const submit = () => {
    setError('');
    if (!form.projectId) {
      setError('請選擇專案');
      return;
    }
    create.mutate({
      projectId: Number(form.projectId),
      date: form.date,
      weather: form.weather,
      temperature: form.temperature,
      workforce: Number(form.workforce),
      summary: form.summary,
      content: form.content,
    });
  };

  return (
    <div>
      <PageHeader
        title="施工日誌"
        subtitle="記錄每日施工進度、天氣與人力"
        actions={
          <Button
            onClick={() => {
              setForm({
                projectId: '',
                date: new Date().toISOString().slice(0, 10),
                weather: 'sunny',
                temperature: '',
                workforce: 0,
                summary: '',
                content: '',
              });
              setError('');
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> 新增日誌
          </Button>
        }
      />

      <Card>
        <div className="border-b border-gray-100 p-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋摘要 / 專案"
              className="pl-9"
            />
          </div>
        </div>
        {isLoading ? (
          <Spinner label="載入施工日誌…" />
        ) : rows.length === 0 ? (
          <EmptyState title="尚無施工日誌" description="點擊右上角「新增日誌」開始建立" />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/construction-logs/${r.id}`)}
          />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新增施工日誌"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button loading={create.isPending} onClick={submit}>
              建立
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="專案" required error={error}>
            <Select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              <option value="">請選擇專案</option>
              {(projects.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="日期">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="天氣">
              <Select
                value={form.weather}
                onChange={(e) => setForm({ ...form, weather: e.target.value as WeatherType })}
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
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                placeholder="如 28°C"
              />
            </Field>
          </div>
          <Field label="出工人數">
            <Input
              type="number"
              value={form.workforce}
              onChange={(e) => setForm({ ...form, workforce: Number(e.target.value) })}
            />
          </Field>
          <Field label="工作摘要">
            <Input
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </Field>
          <Field label="詳細內容">
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
