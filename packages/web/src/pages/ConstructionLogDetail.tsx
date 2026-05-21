import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Plus, Camera } from 'lucide-react';
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
import { uploadFile } from '../lib/upload';
import {
  formatDate,
  WEATHER_LABELS,
  PHOTO_CATEGORIES,
  PHOTO_CATEGORY_LABELS,
  INSPECTION_RESULT_LABELS,
  LOG_STATUS_LABELS,
  type WeatherType,
  type PhotoCategory,
  type InspectionResult,
  type LogStatus,
} from '@pangcheng/shared';

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value || '-'}</p>
    </div>
  );
}

const resultTone: Record<InspectionResult, 'green' | 'red' | 'amber' | 'gray'> = {
  pass: 'green',
  fail: 'red',
  pending: 'amber',
  na: 'gray',
};

export function ConstructionLogDetail() {
  const { id } = useParams();
  const logId = Number(id);
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.constructionLog.get.useQuery({ id: logId });

  const [delOpen, setDelOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photo, setPhoto] = useState({ category: 'during' as PhotoCategory, title: '', description: '' });
  const [picked, setPicked] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const remove = trpc.constructionLog.delete.useMutation({
    onSuccess: () => navigate('/construction-logs'),
  });
  const addPhoto = trpc.inspectionPhoto.create.useMutation({
    onSuccess: () => {
      void utils.constructionLog.get.invalidate({ id: logId });
      setPhotoOpen(false);
      setPicked(null);
      setPhoto({ category: 'during', title: '', description: '' });
    },
  });
  const delPhoto = trpc.inspectionPhoto.delete.useMutation({
    onSuccess: () => void utils.constructionLog.get.invalidate({ id: logId }),
  });

  if (isLoading || !data) return <Spinner label="載入施工日誌…" />;

  const submitPhoto = async () => {
    setPhotoError('');
    if (!picked) {
      setPhotoError('請選擇照片');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(picked);
      addPhoto.mutate({
        projectId: data.projectId,
        constructionLogId: logId,
        category: photo.category,
        title: photo.title || null,
        photoUrl: result.url,
        description: photo.description || null,
        takenAt: data.date,
      });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : '上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Link
        to="/construction-logs"
        className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> 返回施工日誌
      </Link>
      <PageHeader
        title={`${formatDate(data.date)} 施工日誌`}
        subtitle={data.projectName ?? ''}
        actions={
          <>
            {data.status === 'draft' ? (
              <Badge tone="gray">{LOG_STATUS_LABELS.draft}</Badge>
            ) : (
              <Badge tone="green">{LOG_STATUS_LABELS[data.status as LogStatus] ?? data.status}</Badge>
            )}
            <Button variant="outline" onClick={() => navigate(`/construction-logs/${logId}/edit`)}>
              <Pencil className="h-4 w-4" /> 編輯
            </Button>
            <Button variant="danger" onClick={() => setDelOpen(true)}>
              <Trash2 className="h-4 w-4" /> 刪除
            </Button>
          </>
        }
      />

      <Card>
        <SectionTitle>基本資料</SectionTitle>
        <div className="grid grid-cols-2 gap-4 p-4 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">天氣</p>
            <Badge tone="blue">{WEATHER_LABELS[data.weather as WeatherType] ?? data.weather}</Badge>
          </div>
          <Info label="溫度" value={data.temperature} />
          <Info label="出工人數" value={`${data.workforce} 人`} />
          <Info label="記錄人" value={data.recordedBy} />
          <div className="col-span-2 lg:col-span-4">
            <Info label="今日施工概要" value={data.summary} />
          </div>
        </div>
      </Card>

      {/* 施工項目 */}
      <Card className="mt-3">
        <SectionTitle>施工項目（{data.items.length}）</SectionTitle>
        {data.items.length === 0 ? (
          <EmptyState title="尚無施工項目" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                <th className="px-4 py-2">施工項目</th>
                <th className="px-4 py-2">施工部位</th>
                <th className="px-4 py-2">數量</th>
                <th className="px-4 py-2">備註</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-2 font-medium text-ink">{it.name}</td>
                  <td className="px-4 py-2 text-gray-600">{it.location || '-'}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {it.quantity ? `${it.quantity} ${it.unit}` : '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-500">{it.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* 人力配置 */}
        <Card>
          <SectionTitle>人力配置（出工 {data.workforce} 人）</SectionTitle>
          {data.labor.length === 0 ? (
            <EmptyState title="尚無人力配置" />
          ) : (
            <div className="divide-y divide-gray-50">
              {data.labor.map((it, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-ink">{it.trade}</span>
                  <span className="text-sm font-medium text-gray-600">{it.count} 人</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 機具使用 */}
        <Card>
          <SectionTitle>機具使用（{data.equipment.length}）</SectionTitle>
          {data.equipment.length === 0 ? (
            <EmptyState title="尚無機具使用紀錄" />
          ) : (
            <div className="divide-y divide-gray-50">
              {data.equipment.map((it, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-ink">{it.name}</span>
                  <span className="text-sm text-gray-500">
                    {it.count} 台 {it.hours && `· ${it.hours}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 材料進場 */}
      <Card className="mt-3">
        <SectionTitle>材料進場（{data.materials.length}）</SectionTitle>
        {data.materials.length === 0 ? (
          <EmptyState title="尚無材料進場紀錄" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                <th className="px-4 py-2">材料名稱</th>
                <th className="px-4 py-2">規格</th>
                <th className="px-4 py-2">數量</th>
                <th className="px-4 py-2">供應廠商</th>
              </tr>
            </thead>
            <tbody>
              {data.materials.map((it, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-2 font-medium text-ink">{it.name}</td>
                  <td className="px-4 py-2 text-gray-600">{it.spec || '-'}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {it.quantity ? `${it.quantity} ${it.unit}` : '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-500">{it.supplier || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* 自主檢查 */}
      <Card className="mt-3">
        <SectionTitle>自主檢查（{data.inspections.length}）</SectionTitle>
        {data.inspections.length === 0 ? (
          <EmptyState title="尚無自主檢查項目" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                <th className="px-4 py-2">類別</th>
                <th className="px-4 py-2">檢查項目</th>
                <th className="px-4 py-2">部位</th>
                <th className="px-4 py-2">檢查人員</th>
                <th className="px-4 py-2">結果</th>
              </tr>
            </thead>
            <tbody>
              {data.inspections.map((it, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-2 text-gray-600">{it.category || '-'}</td>
                  <td className="px-4 py-2 font-medium text-ink">{it.item}</td>
                  <td className="px-4 py-2 text-gray-600">{it.location || '-'}</td>
                  <td className="px-4 py-2 text-gray-600">{it.inspector || '-'}</td>
                  <td className="px-4 py-2">
                    <Badge tone={resultTone[it.result as InspectionResult] ?? 'gray'}>
                      {INSPECTION_RESULT_LABELS[it.result as InspectionResult] ?? it.result}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* 施工照片 */}
      <Card className="mt-3">
        <SectionTitle
          action={
            <Button size="sm" variant="outline" onClick={() => setPhotoOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> 上傳照片
            </Button>
          }
        >
          施工照片（{data.photos.length}）
        </SectionTitle>
        {data.photos.length === 0 ? (
          <EmptyState title="尚無施工照片" />
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.photos.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-lg border border-gray-200">
                <a href={p.photoUrl} target="_blank" rel="noreferrer">
                  <img src={p.photoUrl} alt={p.title ?? '施工照片'} className="h-32 w-full object-cover" />
                </a>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <Badge tone="slate">
                    {PHOTO_CATEGORY_LABELS[p.category as PhotoCategory] ?? p.category}
                  </Badge>
                  <button
                    onClick={() => delPhoto.mutate({ id: p.id })}
                    className="rounded p-1 text-gray-300 hover:text-brand-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 備註事項 */}
      <Card className="mt-3">
        <SectionTitle>備註事項</SectionTitle>
        <div className="space-y-3 p-4">
          <Info label="重要事項記錄" value={<span className="whitespace-pre-wrap">{data.content}</span>} />
          <Info
            label="協調事項 / 監造指示"
            value={<span className="whitespace-pre-wrap">{data.coordinationNotes}</span>}
          />
          <Info label="工安事項" value={<span className="whitespace-pre-wrap">{data.safetyNotes}</span>} />
        </div>
      </Card>

      <Modal
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        title="上傳施工照片"
        footer={
          <>
            <Button variant="outline" onClick={() => setPhotoOpen(false)}>
              取消
            </Button>
            <Button loading={uploading || addPhoto.isPending} onClick={() => void submitPhoto()}>
              上傳
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="照片分類">
            <Select
              value={photo.category}
              onChange={(e) => setPhoto({ ...photo, category: e.target.value as PhotoCategory })}
            >
              {PHOTO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {PHOTO_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="標題">
            <Input value={photo.title} onChange={(e) => setPhoto({ ...photo, title: e.target.value })} />
          </Field>
          <Field label="說明">
            <Textarea
              value={photo.description}
              onChange={(e) => setPhoto({ ...photo, description: e.target.value })}
            />
          </Field>
          <Field label="選擇照片" required error={photoError}>
            <Input type="file" accept="image/*" onChange={(e) => setPicked(e.target.files?.[0] ?? null)} />
          </Field>
          <p className="flex items-center gap-1 text-xs text-gray-400">
            <Camera className="h-3.5 w-3.5" /> 支援手機拍照直接上傳
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={delOpen}
        title="刪除施工日誌"
        message="確定要刪除此施工日誌嗎？此操作無法復原。"
        loading={remove.isPending}
        onConfirm={() => remove.mutate({ id: logId })}
        onClose={() => setDelOpen(false)}
      />
    </div>
  );
}
