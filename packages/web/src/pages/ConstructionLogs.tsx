import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { trpc } from '../trpc';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  PageHeader,
  Spinner,
  Badge,
  type Column,
} from '../components/ui';
import { formatDate, WEATHER_LABELS, LOG_STATUS_LABELS, type WeatherType, type LogStatus } from '@pangcheng/shared';

type LogRow = {
  id: number;
  projectId: number;
  date: string;
  weather: string;
  temperature: string | null;
  workforce: number;
  summary: string | null;
  status: string;
  recordedBy: string | null;
  projectName: string | null;
};

export function ConstructionLogs() {
  const navigate = useNavigate();
  const { data, isLoading } = trpc.constructionLog.list.useQuery();
  const [keyword, setKeyword] = useState('');

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
    {
      header: '狀態',
      render: (r) =>
        r.status === 'draft' ? (
          <Badge tone="gray">{LOG_STATUS_LABELS.draft}</Badge>
        ) : (
          <Badge tone="green">{LOG_STATUS_LABELS[(r.status as LogStatus)] ?? r.status}</Badge>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="施工日誌"
        subtitle="公共工程施工日誌格式 — 記錄每日施工、人力、機具與檢查"
        actions={
          <Button onClick={() => navigate('/construction-logs/new')}>
            <Plus className="h-4 w-4" /> 新增施工日誌
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
          <EmptyState title="尚無施工日誌" description="點擊右上角「新增施工日誌」開始建立" />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/construction-logs/${r.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
