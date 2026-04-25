'use client';
// src/app/(dashboard)/provider/availability/page.tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { availabilityApi } from '@/lib/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import { CalendarPlus, Trash2, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvailabilitySlot } from '@/types';

const schema = z.object({
  from:           z.string().min(1, 'Required'),
  to:             z.string().min(1, 'Required'),
  slot_duration:  z.coerce.number().min(15),
  work_start:     z.string().min(1, 'Required'),
  work_end:       z.string().min(1, 'Required'),
  days_of_week:   z.array(z.number()).min(1, 'Select at least one day'),
  break_start:    z.string().optional(),
  break_end:      z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ProviderAvailabilityPage() {
  const [viewDate, setViewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewTo]                = useState(format(addDays(new Date(), 6), 'yyyy-MM-dd'));
  const qc = useQueryClient();

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['provider-slots', viewDate, viewTo],
    queryFn: () => availabilityApi.mySlots({ from: viewDate, to: viewTo }).then(r => r.data.slots as AvailabilitySlot[]),
  });

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      from: format(new Date(), 'yyyy-MM-dd'),
      to:   format(addDays(new Date(), 13), 'yyyy-MM-dd'),
      slot_duration: 60,
      work_start: '09:00',
      work_end:   '18:00',
      days_of_week: [1, 2, 3, 4, 5], // Mon-Fri
    },
  });

  const { mutate: generate, isPending } = useMutation({
    mutationFn: (data: FormData) => availabilityApi.generate(data),
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: ['provider-slots'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to generate slots.'),
  });

  const { mutate: toggleBlock } = useMutation({
    mutationFn: (id: number) => availabilityApi.toggleBlock(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['provider-slots'] }); },
  });

  // Group slots by date
  const slotsByDate = slotsData?.reduce((acc: Record<string, AvailabilitySlot[]>, slot) => {
    const d = typeof slot.date === 'string' ? slot.date : format(new Date(slot.date), 'yyyy-MM-dd');
    if (!acc[d]) acc[d] = [];
    acc[d].push(slot);
    return acc;
  }, {}) ?? {};

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Availability</h1>
        <p className="text-gray-500 mt-1">Generate and manage your appointment slots.</p>
      </div>

      {/* Generator form */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
          <CalendarPlus size={18} className="text-brand-600" /> Generate Time Slots
        </h2>
        <form onSubmit={handleSubmit(d => generate(d))} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">From Date</label>
              <input {...register('from')} type="date" className={`input ${errors.from ? 'input-error' : ''}`} />
            </div>
            <div>
              <label className="label">To Date</label>
              <input {...register('to')} type="date" className={`input ${errors.to ? 'input-error' : ''}`} />
            </div>
            <div>
              <label className="label">Slot Duration</label>
              <select {...register('slot_duration')} className="input">
                {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className="label">Work Hours</label>
              <div className="flex gap-1 items-center">
                <input {...register('work_start')} type="time" className="input text-xs px-2" />
                <span className="text-gray-400 text-xs">–</span>
                <input {...register('work_end')} type="time" className="input text-xs px-2" />
              </div>
            </div>
          </div>

          {/* Break time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Break Start <span className="text-gray-400 font-normal">(optional)</span></label>
              <input {...register('break_start')} type="time" className="input" />
            </div>
            <div>
              <label className="label">Break End <span className="text-gray-400 font-normal">(optional)</span></label>
              <input {...register('break_end')} type="time" className="input" />
            </div>
          </div>

          {/* Days of week */}
          <div>
            <label className="label">Working Days</label>
            {errors.days_of_week && <p className="field-error mb-2">{errors.days_of_week.message}</p>}
            <Controller
              control={control}
              name="days_of_week"
              render={({ field }) => (
                <div className="flex gap-2 flex-wrap">
                  {DAY_LABELS.map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const curr = field.value ?? [];
                        field.onChange(curr.includes(idx) ? curr.filter(d => d !== idx) : [...curr, idx]);
                      }}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                        (field.value ?? []).includes(idx)
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <button type="submit" disabled={isPending} className="btn-primary self-start gap-2">
            <CalendarPlus size={16} />
            {isPending ? 'Generating…' : 'Generate Slots'}
          </button>
        </form>
      </div>

      {/* Slot viewer */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-display text-gray-900">Next 7 Days</h2>
          <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="input w-auto text-sm" />
        </div>

        {slotsLoading ? (
          <div className="flex flex-col gap-4">{[1,2,3].map(i => <div key={i} className="card p-4 skeleton h-24" />)}</div>
        ) : Object.keys(slotsByDate).length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-medium">No slots for this range</p>
            <p className="text-sm mt-1">Use the generator above to create slots</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(slotsByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, slots]) => (
              <div key={date} className="card p-4">
                <p className="text-sm font-bold text-gray-800 mb-3">
                  {format(new Date(date + 'T00:00:00'), 'EEEE, dd MMM yyyy')}
                  <span className="ml-2 text-xs text-gray-400 font-normal">{slots.length} slots</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => { if (!slot.is_booked) toggleBlock(slot.id); }}
                      disabled={slot.is_booked}
                      title={slot.is_booked ? 'Booked' : slot.is_blocked ? 'Blocked — click to unblock' : 'Available — click to block'}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        slot.is_booked   ? 'bg-blue-100 text-blue-700 border-blue-200 cursor-not-allowed' :
                        slot.is_blocked  ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' :
                                           'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      )}
                    >
                      {slot.start_time.slice(0,5)}
                      {slot.is_booked   ? ' 📌' : slot.is_blocked ? ' 🔒' : ''}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
