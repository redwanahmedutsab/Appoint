'use client';
// src/components/layout/DashboardSidebar.tsx
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';
import {
  LayoutDashboard, CalendarDays, Heart, User, Settings,
  Building2, ListChecks, BarChart3, LogOut, Shield,
  Users, Layers, DollarSign, AlertCircle, ChevronRight
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

const userNav = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/bookings', icon: CalendarDays,    label: 'My Bookings' },
  { href: '/dashboard/favorites',icon: Heart,           label: 'Favourites' },
  { href: '/dashboard/profile',  icon: User,            label: 'Profile' },
];

const providerNav = [
  { href: '/provider/dashboard',       icon: LayoutDashboard, label: 'Overview' },
  { href: '/provider/bookings',        icon: CalendarDays,    label: 'Bookings' },
  { href: '/provider/services',        icon: ListChecks,      label: 'Services' },
  { href: '/provider/availability',    icon: Settings,        label: 'Availability' },
  { href: '/provider/profile',         icon: Building2,       label: 'Business Profile' },
  { href: '/provider/earnings',        icon: BarChart3,       label: 'Earnings' },
];

const adminNav = [
  { href: '/admin',                    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/providers',          icon: Building2,       label: 'Providers' },
  { href: '/admin/users',              icon: Users,           label: 'Users' },
  { href: '/admin/bookings',           icon: CalendarDays,    label: 'Bookings' },
  { href: '/admin/commissions',        icon: DollarSign,      label: 'Commissions' },
  { href: '/admin/categories',         icon: Layers,          label: 'Categories' },
  { href: '/admin/disputes',           icon: AlertCircle,     label: 'Disputes' },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'provider' ? providerNav : userNav;
  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'provider' ? 'Provider' : 'Customer';

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    toast.success('Logged out.');
    router.push('/');
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 hidden lg:flex">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-gray-900 text-lg">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <span className="text-white text-sm font-black">A</span>
          </div>
          Appointly
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user ? getInitials(user.name) : '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && item.href !== '/provider/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={17} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}

        {/* Role switch link */}
        {user?.role === 'user' && (
          <div className="mt-4 p-3 bg-gradient-to-r from-brand-50 to-accent-50 rounded-xl border border-brand-100">
            <p className="text-xs font-semibold text-brand-800 mb-1">Own a business?</p>
            <Link href="/become-provider" className="text-xs text-brand-600 font-medium hover:text-brand-700">
              Become a Provider →
            </Link>
          </div>
        )}

        {user?.role === 'admin' && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
            <Shield size={14} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">Admin Mode</span>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={17} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
