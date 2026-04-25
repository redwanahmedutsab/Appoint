'use client';
// src/components/layout/PublicNav.tsx
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function PublicNav() {
  const { isAuthenticated, user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardHref =
    user?.role === 'admin' ? '/admin' : user?.role === 'provider' ? '/provider/dashboard' : '/dashboard';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-gray-900 text-xl">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white text-sm font-black">A</span>
            </div>
            Appointly
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/providers" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Browse Services
            </Link>
            {isAuthenticated ? (
              <Link href={dashboardHref} className="btn-primary">
                <User size={15} />
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Log In
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden btn-ghost p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-3 animate-slide-down">
            <Link href="/providers" className="text-sm font-medium text-gray-700 py-2">Browse Services</Link>
            {isAuthenticated ? (
              <Link href={dashboardHref} className="btn-primary w-full justify-center">Dashboard</Link>
            ) : (
              <>
                <Link href="/auth/login" className="btn-secondary w-full justify-center">Log In</Link>
                <Link href="/auth/register" className="btn-primary w-full justify-center">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
