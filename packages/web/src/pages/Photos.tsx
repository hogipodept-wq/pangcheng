import { useMemo, useState } from 'react';
import { Plus, Trash2, Camera } from 'lucide-react';
import { trpc } from '../trpc';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Textarea,
  Badge,
} from '../components/ui';
import { uploadFile } from '../lib/upload';
import {
  formatDate,
  PHOTO_CATEGORIES,
  PHOTO_CATEGORY_LABELS,
  type PhotoCategory,
} from '@pangcheng/shared';

type PhotoRow = {
  id: number;
  projectId: number;
  category: string;
  title: string | null;
  photoUrl: string;
  takenAt: string | null;
  location: string | null;
  description: string | null;
  uploadedBy: string | null;
  createdAt: string;
  projectName: string | null;
};

export function Photos() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.inspectionPhoto.list.useQuery();
  const projects = trpc.project.list.useQuery();
  const [projectFilter, setProjectFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    category: 'during' as PhotoCategory,
    title: '',
    location: '',
    description: '',
    takenAt: new Date().toISOString().slice(0, 10),
  });
  const [picked, setPicked] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const addPhoto = trpc.inspectionPhoto.create.useMutation({
    onSuccess: () => {
      void utils.inspectionPhoto.list.invalidate();
      setOpen(false);
      setPicked(null);
      setForm({
        projectId: '',
        category: 'during',
        title: '',
        location: '',
        description: '',
        takenAt: new Date().toISOString().slice(0, 10),
      });
    },
  });
  const delPhoto = trpc.inspectionPhoto.delete.useMutation({
    onSuccess: () => void utils.inspectionPhoto.list.invalidate(),
  });

  const rows = useMemo(() => {
    let list = (data ?? []) as PhotoRow[];
    if (projectFilter) list = list.filter((p) => String(p.projectId) === projectFilter);
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);
    return list;
  }, [data, projectFilter, categoryFilter]);

  const submit = async () => {
    setError('');
    if (!form.projectId) {
      setError('請選擇專案');
      return;
    }
    if (!picked) {
      setError('請選擇照片');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(picked);
      addPhoto.mutate({
        projectId: Number(form.projectId),
        category: form.category,
        title: form.title || null,
        location: form.location || null,
        description: form.description || null,
        photoUrl: result.url,
        takenAt: form.takenAt || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="施工照片"
        subtitle="工地施工照片與自主檢查紀錄"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> 上傳照片
          </Button>
        }
      />

      <Card className="mb-3">
        <div className="flex flex-wrap gap-2 p-3">
          <Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="max-w-52"
          >
            <option value="">全部專案</option>
            {(projects.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="max-w-40"
          >
            <option value="">全部分類</option>
            {PHOTO_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PHOTO_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <Spinner label="載入照片…" />
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState title="尚無施工照片" description="點擊右上角「上傳照片」開始建立" />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((p) => (
            <Card key={p.id} className="group overflow-hidden">
              <a href={p.photoUrl} target="_blank" rel="noreferrer">
                <img
                  src={p.photoUrl}
                  alt={p.title ?? '施工照片'}
                  className="h-40 w-full object-cover"
                />
              </a>
              <div className="p-2.5">
                <div className="flex items-center justify-between">
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
                <p className="mt-1.5 truncate text-sm font-medium text-ink">
                  {p.title || '未命名照片'}
                </p>
                <p className="truncate text-xs text-gray-400">{p.projectName}</p>
                <p className="mt-0.5 text-xs text-gray-300">{formatDate(p.takenAt ?? p.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="上傳施工照片"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button loading={uploading || addPhoto.isPending} onClick={() => void submit()}>
              上傳
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="照片分類">
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as PhotoCategory })}
              >
                {PHOTO_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {PHOTO_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="拍攝日期">
              <Input
                type="date"
                value={form.takenAt}
                onChange={(e) => setForm({ ...form, takenAt: e.target.value })}
              />
            </Field>
          </div>
          <Field label="標題">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="位置">
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="如：B2 樓板東側"
            />
          </Field>
          <Field label="說明">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="選擇照片" required>
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
    </div>
  );
}
