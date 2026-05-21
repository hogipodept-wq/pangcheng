export interface UploadResult {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

/** 上傳檔案至後端，回傳檔案 URL */
export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? '檔案上傳失敗');
  }
  return (await res.json()) as UploadResult;
}
