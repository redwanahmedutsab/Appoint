'use client';
// src/app/(dashboard)/provider/earnings/page.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { CommissionRecord } from '@/types';

export default function ProviderEarningsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['provider-earnings'],
    queryFn: () => api.get('/provider/commissions').then(r => r.data),
  });

  const records: CommissionRecord[] = data?.data ?? [];
  const summary = data?.summary ?? {};

  const statusStyle: Record<string, string> = {
    settled: 'bg-green-50 text-green-700 border-green-100',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Earnings</h1>
        <p className="text-gray-500 mt-1">Track your revenue and commission settlements.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp,   label: 'Total Revenue',       value: summary.total_revenue        ?? 0, color: 'text-brand-600', bg: 'bg-brand-50' },
          { icon: DollarSign,   label: 'Total Commission',    value: summary.total_commission     ?? 0, color: 'text-red-500',   bg: 'bg-red-50' },
          { icon: CheckCircle,  label: 'Settled',             value: summary.settled_commission   ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: Clock,        label: 'Pending Settlement',  value: summary.pending_commission   ?? 0, color: 'text-yellow-600',bg: 'bg-yellow-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon size={18} className={s.color} />
              </div>
              <div className="stat-value">{isLoading ? '—' : formatCurrency(s.value)}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Records table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Commission Records</h2>
        </div>
        {isLoading ? (
          <div className="p-5 flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center">
            <DollarSign size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No earnings records yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete bookings to start earning.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Period</th>
                  <th className="text-right px-5 py-3">Service Amount</th>
                  <th className="text-right px-5 py-3">Commission</th>
                  <th className="text-right px-5 py-3">Net</th>
                  <th className="text-center px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((r: CommissionRecord) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-gray-600">
                      {r.week_start && r.week_end ? `${r.week_start} – ${r.week_end}` : new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-gray-900">{formatCurrency(r.service_amount)}</td>
                    <td className="px-5 py-4 text-right text-red-600">-{formatCurrency(r.commission_amount)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-brand-600">{formatCurrency(r.service_amount - r.commission_amount)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={cn('badge border text-xs capitalize', statusStyle[r.settlement_status] ?? '')}>
                        {r.settlement_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
