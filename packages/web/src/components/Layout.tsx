import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  FileText,
  Files,
  Building2,
  Building,
  FolderKanban,
  ShoppingCart,
  Truck,
  Landmark,
  ClipboardList,
  Camera,
  CalendarDays,
  BarChart3,
  ShieldCheck,
  Bell,
  LogOut,
  Menu,
  X,
  PanelLeft,
  type LucideIcon,
} from 'lucide-react';
import { trpc } from '../trpc';
import { useAuth } from '../auth';
import { ROLE_LABELS, NOTIFICATION_TYPE_LABELS, formatDateTime, type Role } from '@pangcheng/shared';
import { cn } from './ui';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: '儀表板', icon: LayoutGrid, end: true },
  { to: '/staff', label: '人員管理', icon: Users },
  { to: '/quotations', label: '報價作業', icon: FileText },
  { to: '/quotation-templates', label: '報價範本', icon: Files },
  { to: '/clients', label: '客戶管理', icon: Building2 },
  { to: '/projects', label: '專案管理', icon: FolderKanban },
  { to: '/procurement', label: '採購中心', icon: ShoppingCart },
  { to: '/suppliers', label: '廠商管理', icon: Truck },
  { to: '/finance', label: '財務作業', icon: Landmark },
  { to: '/construction-logs', label: '施工日誌', icon: ClipboardList },
  { to: '/photos', label: '施工照片', icon: Camera },
  { to: '/calendar', label: '行事曆', icon: CalendarDays },
  { to: '/reports', label: '報表中心', icon: BarChart3 },
  { to: '/permissions', label: '權限設定', icon: ShieldCheck },
  { to: '/company', label: '公司設定', icon: Building },
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
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
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
                    !n.read && 'bg-brand-50/50',
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
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetch();
      navigate('/login');
    },
  });

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    const match = NAV.filter((n) => (n.end ? path === n.to : path === n.to || path.startsWith(n.to + '/')))
      .sort((a, b) => b.to.length - a.to.length)[0];
    return match?.label ?? '營造工程 ERP';
  }, [location.pathname]);

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-60';

  return (
    <div className="flex h-full">
      {/* 側邊欄 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-gray-300 transition-all duration-200 lg:static lg:translate-x-0',
          sidebarWidth,
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 items-center gap-2.5 border-b border-sidebar-line px-4',
            collapsed && 'justify-center px-0',
          )}
        >
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-sidebar-soft hover:text-white lg:block"
            title={collapsed ? '展開選單' : '收合選單'}
          >
            <PanelLeft className="h-[18px] w-[18px]" />
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-[15px] font-bold text-white">營造工程 ERP</span>
            </div>
          )}
          {collapsed && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* 導覽 */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-white font-semibold text-ink'
                    : 'text-gray-400 hover:bg-sidebar-soft hover:text-white',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* 使用者 */}
        <div
          className={cn(
            'flex items-center gap-2.5 border-t border-sidebar-line px-4 py-3',
            collapsed && 'justify-center px-0',
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {user?.name?.[0] ?? '?'}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                <p className="truncate text-[11px] text-gray-500">
                  {ROLE_LABELS[(user?.role ?? 'user') as Role]}
                </p>
              </div>
              <button
                onClick={() => logout.mutate()}
                title="登出"
                className="rounded-md p-1.5 text-gray-500 hover:bg-sidebar-soft hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 主內容 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-base font-bold text-ink">{pageTitle}</h1>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
