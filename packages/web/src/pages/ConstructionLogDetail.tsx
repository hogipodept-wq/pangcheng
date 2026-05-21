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
  WEATHER_TYPES,
  WEATHER_LABELS,
  PHOTO_CATEGORIES,
  PHOTO_CATEGORY_LABELS,
  type WeatherType,
  type PhotoCategory,
} from '@pangcheng/shared';

export function ConstructionLogDetail() {
  const { id } = useParams();
  const logId = Number(id);
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.constructionLog.get.useQuery({ id: logId });

  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [form, setForm] = useState({
    date: '',
    weather: 'sunny' as WeatherType,
    temperature: '',
    workforce: 0,
    summary: '',
    content: '',
  });
  const [photo, setPhoto] = useState({ category: 'during' as PhotoCategory, title: '', description: '' });
  const [picked, setPicked] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const update = trpc.constructionLog.update.useMutation({
    onSuccess: () => {
      void utils.constructionLog.get.invalidate({ id: logId });
      setEditOpen(false);
    },
  });
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
            <Button
              variant="outline"
              onClick={() => {
                setForm({
                  date: data.date,
                  weather: data.weather as WeatherType,
                  temperature: data.temperature ?? '',
                  workforce: data.workforce,
                  summary: data.summary ?? '',
                  content: data.content ?? '',
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

      <Card>
        <SectionTitle>日誌內容</SectionTitle>
        <div className="grid grid-cols-2 gap-4 p-4 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">天氣</p>
            <Badge tone="blue">{WEATHER_LABELS[data.weather as WeatherType] ?? data.weather}</Badge>
          </div>
          <div>
            <p className="text-xs text-gray-400">溫度</p>
            <p className="mt-0.5 text-sm text-ink">{data.temperature || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">出工人數</p>
            <p className="mt-0.5 text-sm text-ink">{data.workforce} 人</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">記錄人</p>
            <p className="mt-0.5 text-sm text-ink">{data.recordedBy || '-'}</p>
          </div>
        </div>
        <div className="border-t border-gray-100 p-4">
          <p className="text-xs text-gray-400">工作摘要</p>
          <p className="mt-0.5 text-sm font-medium text-ink">{data.summary || '-'}</p>
          <p className="mt-3 text-xs text-gray-400">詳細內容</p>
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-700">{data.content || '-'}</p>
        </div>
      </Card>

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
              <div key={p.id} className="group overflow-hidden rounded-lg border border-gray-200">
                <a href={p.photoUrl} target="_blank" rel="noreferrer">
                  <img
                    src={p.photoUrl}
                    alt={p.title ?? '施工照片'}
                    className="h-32 w-full object-cover"
                  />
                </a>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="min-w-0">
                    <Badge tone="slate">
                      {PHOTO_CATEGORY_LABELS[p.category as PhotoCategory] ?? p.category}
                    </Badge>
                    {p.title && <p className="mt-0.5 truncate text-xs text-gray-500">{p.title}</p>}
                  </div>
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

      {/* 編輯日誌 */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="編輯施工日誌"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button
              loading={update.isPending}
              onClick={() =>
                update.mutate({
                  id: logId,
                  projectId: data.projectId,
                  date: form.date,
                  weather: form.weather,
                  temperature: form.temperature,
                  workforce: Number(form.workforce),
                  summary: form.summary,
                  content: form.content,
                })
              }
            >
              儲存
            </Button>
          </>
        }
      >
        <div className="space-y-3">
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

      {/* 上傳照片 */}
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
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPicked(e.target.files?.[0] ?? null)}
            />
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
