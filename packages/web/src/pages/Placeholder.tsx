import { Construction } from 'lucide-react';
import { PageHeader, Card } from '../components/ui';

export function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle={description} />
      <Card className="p-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
            <Construction className="h-7 w-7 text-amber-500" />
          </div>
          <p className="text-base font-bold text-ink">此模組開發中</p>
          <p className="max-w-md text-sm text-gray-500">
            「{title}」模組已規劃於系統藍圖中，將於後續開發階段完成。
            目前可先使用儀表板、專案、採購、廠商、業主、施工日誌與照片等模組。
          </p>
        </div>
      </Card>
    </div>
  );
}
