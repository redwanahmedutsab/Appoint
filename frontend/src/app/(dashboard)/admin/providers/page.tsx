'use client';
// src/app/(dashboard)/admin/providers/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { approvalStatusConfig, cn, formatDate } from '@/lib/utils';
import { Search, CheckCircle, XCircle, Ban, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProviderProfile } from '@/types';
import { PaginatedResponse } from '@/types';

export default function AdminProvidersPage() {
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-providers', search, status, page],
    queryFn: () => adminApi.providers({ search: search || undefined, status: status || undefined, page }).then(r => r.data as PaginatedResponse<ProviderProfile>),
    placeholderData: (p) => p,
  });

  const { mutate: approve } = useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: 'approve' | 'reject'; reason?: string }) =>
      adminApi.approveProvider(id, { action, reason }),
    onSuccess: (_, vars) => {
      toast.success(vars.action === 'approve' ? 'Provider approved!' : 'Provider rejected.');
      qc.invalidateQueries({ queryKey: ['admin-providers'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setRejectId(null);
      setRejectReason('');
    },
    onError: () => toast.error('Action failed.'),
  });

  const { mutate: suspend } = useMutation({
    mutationFn: (id: number) => adminApi.suspendProvider(id),
    onSuccess: () => { toast.success('Provider suspended.'); qc.invalidateQueries({ queryKey: ['admin-providers'] }); },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Providers</h1>
        <p className="text-gray-500 mt-1">Manage and approve service provider accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-card">
          <Search size={15} className="text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search business name…" className="flex-1 text-sm focus:outline-none bg-transparent" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Business</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden lg:table-cell">Area</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden lg:table-cell">Joined</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[1,2,3,4,5,6].map(j => <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" /></td>)}
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No providers found</td></tr>
              ) : (
                data?.data?.map((p) => {
                  const st = approvalStatusConfig[p.approval_status];
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{p.business_name}</p>
                          <p className="text-xs text-gray-400">{p.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-gray-600">{p.category?.name}</td>
                      <td className="px-5 py-4 hidden lg:table-cell text-gray-600">{p.neighborhood?.name}</td>
                      <td className="px-5 py-4 hidden lg:table-cell text-gray-500 text-xs">{formatDate(p.created_at)}</td>
                      <td className="px-5 py-4">
                        <span className={cn('badge border text-xs', st.bg, st.color)}>{st.label}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {p.approval_status === 'pending' && (
                            <>
                              <button onClick={() => approve({ id: p.id, action: 'approve' })} className="btn-ghost btn-sm text-green-600 hover:bg-green-50">
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button onClick={() => { setRejectId(p.id); }} className="btn-ghost btn-sm text-red-500 hover:bg-red-50">
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}
                          {p.approval_status === 'approved' && (
                            <button onClick={() => suspend(p.id)} className="btn-ghost btn-sm text-gray-500 hover:bg-gray-100">
                              <Ban size={14} /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.last_page ?? 1) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{data?.total} providers</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm disabled:opacity-40">Prev</button>
              <span className="text-xs text-gray-500">{page} / {data?.last_page}</span>
              <button disabled={page === data?.last_page} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Provider</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejection.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection…"
              className="input resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => approve({ id: rejectId, action: 'reject', reason: rejectReason })} disabled={!rejectReason.trim()} className="btn-danger flex-1 disabled:opacity-50">
                Confirm Rejection
              </button>
              <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
