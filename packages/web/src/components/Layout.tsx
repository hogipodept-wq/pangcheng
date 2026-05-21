import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Camera,
  CalendarDays,
  ShoppingCart,
  Truck,
  FileText,
  Building2,
  Calculator,
  Wallet,
  BarChart3,
  Users,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  HardHat,
} from 'lucide-react';
import { trpc } from '../trpc';
import { useAuth } from '../auth';
import { ROLE_LABELS, NOTIFICATION_TYPE_LABELS, formatDateTime, type Role } from '@pangcheng/shared';
import { cn } from './ui';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: '總覽',
    items: [{ to: '/', label: '儀表板', icon: LayoutDashboard, end: true }],
  },
  {
    title: '工程管理',
    items: [
      { to: '/projects', label: '專案管理', icon: FolderKanban },
      { to: '/construction-logs', label: '施工日誌', icon: ClipboardList },
      { to: '/photos', label: '施工照片', icon: Camera },
      { to: '/calendar', label: '行事曆', icon: CalendarDays },
    ],
  },
  {
    title: '採購與廠商',
    items: [
      { to: '/procurement', label: '採購管理', icon: ShoppingCart },
      { to: '/suppliers', label: '廠商管理', icon: Truck },
    ],
  },
  {
    title: '業務往來',
    items: [
      { to: '/quotations', label: '報價管理', icon: FileText },
      { to: '/clients', label: '業主管理', icon: Building2 },
    ],
  },
  {
    title: '財務',
    items: [
      { to: '/finance', label: '財務作業', icon: Calculator },
      { to: '/petty-cash', label: '零用金', icon: Wallet },
      { to: '/reports', label: '報表中心', icon: BarChart3 },
    ],
  },
  {
    title: '人事與設定',
    items: [
      { to: '/staff', label: '人員管理', icon: Users },
      { to: '/settings', label: '系統設定', icon: Settings },
    ],
  },
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const list = trpc.notification.list.useQuery(undefined, { enabled: open });
  const count = trpc.notification.unreadCount.useQuery();
  const markAll = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      void utils.notification.invalidate();
    },
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {(count.data ?? 0) > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {count.data}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
              <span className="text-sm font-bold text-ink">通知中心</span>
              <button
                onClick={() => markAll.mutate()}
                className="text-xs text-brand-600 hover:underline"
              >
                全部標示已讀
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {(list.data ?? []).length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-gray-400">目前沒有通知</p>
              )}
              {(list.data ?? []).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'border-b border-gray-50 px-4 py-2.5 last:border-0',
                    !n.read && 'bg-brand-50/40',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{n.title}</span>
                    <span className="text-[10px] text-gray-400">
                      {NOTIFICATION_TYPE_LABELS[n.type as keyof typeof NOTIFICATION_TYPE_LABELS] ??
                        n.type}
                    </span>
                  </div>
                  {n.message && <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>}
                  <p className="mt-1 text-[10px] text-gray-300">{formatDateTime(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Layout() {
  const { user, refetch } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetch();
      navigate('/login');
    },
  });

  return (
    <div className="flex h-full">
      {/* 側邊欄 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-ink text-gray-300 transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-ink-line px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <HardHat className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">磐承營造工程</p>
            <p className="text-[10px] tracking-widest text-gray-500">CONSTRUCTION ERP</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                {group.title}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-brand-600 font-medium text-white'
                        : 'text-gray-400 hover:bg-ink-soft hover:text-white',
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 主內容 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 sm:px-6">
          <button
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex flex-1 items-center justify-end gap-2">
            <NotificationBell />
            <div className="flex items-center gap-2.5 border-l border-gray-200 pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {user?.name?.[0] ?? '?'}
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight text-ink">{user?.name}</p>
                <p className="text-[11px] leading-tight text-gray-400">
                  {ROLE_LABELS[(user?.role ?? 'user') as Role]}
                </p>
              </div>
              <button
                onClick={() => logout.mutate()}
                title="登出"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
