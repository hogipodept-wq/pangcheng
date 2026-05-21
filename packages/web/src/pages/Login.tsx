import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { trpc } from '../trpc';
import { useAuth } from '../auth';
import { Button, Field, Input } from '../components/ui';

export function Login() {
  const { user, isLoading, refetch } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = trpc.auth.login.useMutation({
    onSuccess: () => {
      refetch();
      navigate('/', { replace: true });
    },
    onError: (e) => setError(e.message),
  });

  if (!isLoading && user) return <Navigate to="/" replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    login.mutate({ username: username.trim(), password });
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-ink p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <HardHat className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">磐承營造工程 ERP</h1>
          <p className="mt-1 text-xs tracking-widest text-gray-500">CONSTRUCTION ERP SYSTEM</p>
        </div>
        <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-2xl">
          <h2 className="mb-4 text-base font-bold text-ink">系統登入</h2>
          <div className="space-y-3">
            <Field label="帳號" required>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入帳號"
                autoFocus
              />
            </Field>
            <Field label="密碼" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
              />
            </Field>
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>
          )}
          <Button type="submit" loading={login.isPending} className="mt-4 w-full">
            登入
          </Button>
          <p className="mt-4 text-center text-xs text-gray-400">
            預設管理員帳號 admin ／ 密碼 admin1234
          </p>
        </form>
      </div>
    </div>
  );
}
