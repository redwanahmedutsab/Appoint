'use client';
// src/app/(dashboard)/admin/users/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Search, ShieldOff, ShieldCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { User, PaginatedResponse } from '@/types';

const roleStyle: Record<string, string> = {
  admin:    'bg-violet-50 text-violet-700 border-violet-100',
  provider: 'bg-blue-50 text-blue-700 border-blue-100',
  user:     'bg-gray-50 text-gray-600 border-gray-200',
};
const statusStyle: Record<string, string> = {
  active:    'bg-green-50 text-green-700 border-green-100',
  suspended: 'bg-red-50 text-red-600 border-red-100',
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-100',
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: () =>
      adminApi.users({ search: search || undefined, page }).then(r => r.data as PaginatedResponse<User>),
    placeholderData: p => p,
  });

  const { mutate: toggle } = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserStatus(id),
    onSuccess: (_, id) => {
      const user = data?.data?.find(u => u.id === id);
      toast.success(user?.status === 'active' ? 'User suspended.' : 'User reactivated.');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Action failed.'),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">Manage all registered customer and provider accounts.</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-card max-w-md">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="flex-1 text-sm focus:outline-none bg-transparent"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Phone</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Joined</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <Users size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400">No users found</p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((u: User) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">
                          {u.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-gray-500 text-xs">{u.phone ?? '—'}</td>
                    <td className="px-5 py-4 hidden lg:table-cell text-gray-400 text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-4">
                      <span className={cn('badge border text-xs capitalize', roleStyle[u.role] ?? 'bg-gray-50 text-gray-500')}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('badge border text-xs capitalize', statusStyle[u.status] ?? 'bg-gray-50 text-gray-500')}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`${u.status === 'active' ? 'Suspend' : 'Reactivate'} ${u.name}?`)) toggle(u.id);
                          }}
                          className={cn(
                            'btn-ghost btn-sm gap-1',
                            u.status === 'active' ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                          )}
                        >
                          {u.status === 'active'
                            ? <><ShieldOff size={13} /> Suspend</>
                            : <><ShieldCheck size={13} /> Activate</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.last_page ?? 1) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{data?.total} users total</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="btn-secondary btn-sm disabled:opacity-40">Prev</button>
              <span className="text-xs text-gray-500">{page} / {data?.last_page}</span>
              <button disabled={page === data?.last_page} onClick={() => setPage(p => p + 1)}
                className="btn-secondary btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
