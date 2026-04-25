'use client';
// src/app/(dashboard)/admin/commissions/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Download, CheckSquare, DollarSign, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export default function AdminCommissionsPage() {
  const [status, setStatus]     = useState('');
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [page, setPage]         = useState(1);
  const [settleModal, setSettleModal] = useState(false);
  const [settleForm, setSettleForm]   = useState({
    provider_id: '',
    week_start: format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'),
    week_end:   format(endOfWeek(new Date(),   { weekStartsOn: 0 }), 'yyyy-MM-dd'),
  });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-commissions', status, from, to, page],
    queryFn: () => adminApi.commissions({ status: status || undefined, from: from || undefined, to: to || undefined, page }).then(r => r.data),
    placeholderData: (p) => p,
  });

  const { mutate: settle, isPending: settling } = useMutation({
    mutationFn: () => adminApi.settleCommissions({
      provider_id: Number(settleForm.provider_id),
      week_start:  settleForm.week_start,
      week_end:    settleForm.week_end,
    }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: ['admin-commissions'] });
      setSettleModal(false);
    },
    onError: () => toast.error('Settlement failed.'),
  });

  const handleExport = async () => {
    try {
      const res = await adminApi.exportCommissions({ from: from || undefined, to: to || undefined });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href = url;
      a.download = `commissions_${from || 'all'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported.');
    } catch { toast.error('Export failed.'); }
  };

  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Commissions</h1>
          <p className="text-gray-500 mt-1">Track and settle provider commissions (5% per booking).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary gap-2">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => setSettleModal(true)} className="btn-primary gap-2">
            <CheckSquare size={15} /> Settle Commissions
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Clock,      label: 'Pending Settlement', value: summary ? formatCurrency(summary.total_pending)  : '—', color: 'text-amber-600',  bg: 'bg-amber-50' },
          { icon: CheckSquare,label: 'Total Settled',       value: summary ? formatCurrency(summary.total_settled)  : '—', color: 'text-green-600',  bg: 'bg-green-50' },
          { icon: TrendingUp, label: 'All-Time Earnings',   value: summary ? formatCurrency(summary.total_all_time) : '—', color: 'text-brand-600',  bg: 'bg-brand-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon size={18} className={s.color} />
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="settled">Settled</option>
        </select>
        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className="input w-auto" placeholder="From" />
        <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} className="input w-auto" placeholder="To" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Booking</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Provider</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Date</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Service Amt</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Commission</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[1,2,3,4,5,6].map(j => <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" /></td>)}
                  </tr>
                ))
              ) : data?.records?.data?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No commission records</td></tr>
              ) : (
                data?.records?.data?.map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs text-gray-600">{r.booking?.booking_reference}</p>
                      <p className="text-xs text-gray-400">{r.booking?.booking_date}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-gray-700">{r.provider?.business_name}</td>
                    <td className="px-5 py-4 hidden md:table-cell text-xs text-gray-500">{formatDate(r.created_at)}</td>
                    <td className="px-5 py-4 text-right font-medium text-gray-900">{formatCurrency(r.service_amount)}</td>
                    <td className="px-5 py-4 text-right font-bold text-brand-600">{formatCurrency(r.commission_amount)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={cn('badge border text-xs', r.settlement_status === 'settled' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100')}>
                        {r.settlement_status === 'settled' ? 'Settled' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {(data?.records?.last_page ?? 1) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{data?.records?.total} records</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm disabled:opacity-40">Prev</button>
              <span className="text-xs text-gray-500">{page} / {data?.records?.last_page}</span>
              <button disabled={page === data?.records?.last_page} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Settle modal */}
      {settleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Settle Commissions</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Provider ID</label>
                <input type="number" value={settleForm.provider_id} onChange={e => setSettleForm(f => ({ ...f, provider_id: e.target.value }))} className="input" placeholder="Enter provider ID" />
              </div>
              <div>
                <label className="label">Week Start</label>
                <input type="date" value={settleForm.week_start} onChange={e => setSettleForm(f => ({ ...f, week_start: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Week End</label>
                <input type="date" value={settleForm.week_end} onChange={e => setSettleForm(f => ({ ...f, week_end: e.target.value }))} className="input" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => settle()} disabled={settling || !settleForm.provider_id} className="btn-primary flex-1 disabled:opacity-50">
                {settling ? 'Processing…' : 'Mark as Settled'}
              </button>
              <button onClick={() => setSettleModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
