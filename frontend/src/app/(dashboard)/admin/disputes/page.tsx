'use client';
// src/app/(dashboard)/admin/disputes/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dispute, DisputeStatus } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const statusStyle: Record<DisputeStatus, string> = {
  open:         'bg-red-50 text-red-600 border-red-100',
  under_review: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  resolved:     'bg-green-50 text-green-700 border-green-100',
  closed:       'bg-gray-50 text-gray-500 border-gray-200',
};

const resolveSchema = z.object({
  resolution: z.string().min(10, 'Please provide a resolution (min 10 chars)'),
  status:     z.enum(['resolved', 'closed']),
});
type ResolveForm = z.infer<typeof resolveSchema>;

export default function AdminDisputesPage() {
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]                 = useState(1);
  const [expanded, setExpanded]         = useState<number | null>(null);
  const [resolvingId, setResolvingId]   = useState<number | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', filterStatus, page],
    queryFn: () =>
      adminApi.disputes({ status: filterStatus || undefined, page }).then(r => r.data),
    placeholderData: p => p,
  });

  const disputes: Dispute[] = data?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResolveForm>({
    resolver: zodResolver(resolveSchema),
    defaultValues: { status: 'resolved' },
  });

  const { mutate: resolve, isPending: resolving } = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ResolveForm }) =>
      adminApi.resolveDispute(id, data),
    onSuccess: () => {
      toast.success('Dispute resolved!');
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setResolvingId(null);
      reset();
    },
    onError: () => toast.error('Failed to resolve dispute.'),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Disputes</h1>
        <p className="text-gray-500 mt-1">Review and resolve booking disputes raised by users or providers.</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">All Disputes</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        {data?.total !== undefined && (
          <span className="text-sm text-gray-500">{data.total} total</span>
        )}
      </div>

      {/* Dispute cards */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="card p-5 skeleton h-20" />)}
        </div>
      ) : disputes.length === 0 ? (
        <div className="card p-16 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-2">No disputes found</h3>
          <p className="text-sm text-gray-400">
            {filterStatus ? 'Try changing the status filter.' : 'All clear — no disputes have been raised.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {disputes.map((d: Dispute) => {
            const isOpen   = expanded === d.id;
            const isActive = d.status === 'open' || d.status === 'under_review';
            const style    = statusStyle[d.status];

            return (
              <div key={d.id} className="card overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : d.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">
                        Booking #{d.booking?.booking_reference ?? d.booking_id}
                      </p>
                      <span className={cn('badge border text-xs capitalize', style)}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Raised by {d.raisedBy?.name ?? 'Unknown'} · {formatDate(d.created_at)}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-5 flex flex-col gap-4">
                    {/* Booking info */}
                    {d.booking && (
                      <div className="bg-gray-50 rounded-xl p-4 text-sm grid grid-cols-2 gap-2">
                        <div><span className="text-gray-400">Customer</span><p className="font-medium text-gray-800">{d.booking.user?.name}</p></div>
                        <div><span className="text-gray-400">Provider</span><p className="font-medium text-gray-800">{d.booking.provider?.business_name}</p></div>
                        <div><span className="text-gray-400">Service</span><p className="font-medium text-gray-800">{d.booking.service?.name}</p></div>
                        <div><span className="text-gray-400">Date</span><p className="font-medium text-gray-800">{d.booking.booking_date}</p></div>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Dispute Description</p>
                      <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-xl p-3">{d.description}</p>
                    </div>

                    {/* Existing resolution */}
                    {d.resolution && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Resolution</p>
                        <p className="text-sm text-gray-700 bg-green-50 border border-green-100 rounded-xl p-3">{d.resolution}</p>
                      </div>
                    )}

                    {/* Resolve form */}
                    {isActive && (
                      resolvingId === d.id ? (
                        <form onSubmit={handleSubmit(fd => resolve({ id: d.id, data: fd }))} className="flex flex-col gap-3 bg-white border border-gray-200 rounded-xl p-4">
                          <p className="text-sm font-semibold text-gray-800">Resolve Dispute</p>
                          <div>
                            <label className="label">Resolution Notes</label>
                            <textarea {...register('resolution')} rows={3} className={`input resize-none ${errors.resolution ? 'input-error' : ''}`} placeholder="Describe the resolution and any actions taken…" />
                            {errors.resolution && <p className="field-error">{errors.resolution.message}</p>}
                          </div>
                          <div>
                            <label className="label">Close as</label>
                            <select {...register('status')} className="input">
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed (no action)</option>
                            </select>
                          </div>
                          <div className="flex gap-3">
                            <button type="submit" disabled={resolving} className="btn-primary flex-1 disabled:opacity-50">
                              {resolving ? <Loader2 size={14} className="animate-spin" /> : null}
                              {resolving ? 'Saving…' : 'Submit Resolution'}
                            </button>
                            <button type="button" onClick={() => { setResolvingId(null); reset(); }} className="btn-secondary flex-1">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => setResolvingId(d.id)} className="btn-primary self-start">
                          Resolve Dispute
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {(data?.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">{data?.total} disputes</p>
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
  );
}
