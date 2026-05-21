import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-black text-brand-600">404</p>
      <p className="mt-2 text-base font-bold text-ink">找不到此頁面</p>
      <p className="mt-1 text-sm text-gray-500">您要找的頁面不存在或已被移除。</p>
      <Link to="/" className="mt-4">
        <Button>返回儀表板</Button>
      </Link>
    </div>
  );
}
