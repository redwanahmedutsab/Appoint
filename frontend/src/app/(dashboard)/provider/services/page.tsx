'use client';
// src/app/(dashboard)/provider/services/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Service } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name:             z.string().min(2, 'Name is required'),
  description:      z.string().optional(),
  price:            z.coerce.number().min(1, 'Price must be at least 1'),
  duration_minutes: z.coerce.number().min(15, 'Duration must be at least 15 min'),
});
type ServiceForm = z.infer<typeof schema>;

export default function ProviderServicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Service | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['provider-services'],
    queryFn: () => serviceApi.myServices().then(r => r.data.services as Service[]),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceForm>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => { reset({}); setEditing(null); setShowForm(true); };
  const openEdit   = (s: Service) => { reset({ name: s.name, description: s.description, price: s.price, duration_minutes: s.duration_minutes }); setEditing(s); setShowForm(true); };

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (data: ServiceForm) =>
      editing ? serviceApi.update(editing.id, data) : serviceApi.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Service updated.' : 'Service created!');
      qc.invalidateQueries({ queryKey: ['provider-services'] });
      setShowForm(false);
      setEditing(null);
    },
    onError: () => toast.error('Failed to save service.'),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: (s: Service) => serviceApi.update(s.id, { is_active: !s.is_active }),
    onSuccess: () => { toast.success('Service updated.'); qc.invalidateQueries({ queryKey: ['provider-services'] }); },
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: number) => serviceApi.delete(id),
    onSuccess: () => { toast.success('Service deleted.'); qc.invalidateQueries({ queryKey: ['provider-services'] }); },
    onError: () => toast.error('Cannot delete a service with existing bookings.'),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Services</h1>
          <p className="text-gray-500 mt-1">Manage the services you offer to customers.</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Service list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card p-5 skeleton h-28" />)}
        </div>
      ) : data?.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🛠️</div>
          <h3 className="font-semibold text-gray-700 mb-2">No services yet</h3>
          <p className="text-sm text-gray-400 mb-4">Add your first service to start receiving bookings</p>
          <button onClick={openCreate} className="btn-primary">Add Service</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.map((s: Service) => (
            <div key={s.id} className={cn('card p-5 flex flex-col gap-3 transition-opacity', !s.is_active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  {s.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{s.description}</p>}
                </div>
                <span className={cn('badge border text-xs shrink-0', s.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-200')}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-bold text-brand-600 text-base">{formatCurrency(s.price)}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} />{s.duration_minutes} min</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                <button onClick={() => openEdit(s)} className="btn-ghost btn-sm gap-1"><Pencil size={13} />Edit</button>
                <button onClick={() => toggle(s)} className="btn-ghost btn-sm gap-1 text-gray-500">
                  {s.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                  {s.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => { if (confirm('Delete this service?')) remove(s.id); }} className="btn-ghost btn-sm gap-1 text-red-500 hover:bg-red-50 ml-auto">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editing ? 'Edit Service' : 'Add New Service'}</h3>
            <form onSubmit={handleSubmit(d => save(d))} className="flex flex-col gap-4">
              <div>
                <label className="label">Service Name</label>
                <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Men's Haircut" />
                {errors.name && <p className="field-error">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea {...register('description')} rows={2} className="input resize-none" placeholder="Brief description of the service" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (৳)</label>
                  <input {...register('price')} type="number" min="1" className={`input ${errors.price ? 'input-error' : ''}`} placeholder="500" />
                  {errors.price && <p className="field-error">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input {...register('duration_minutes')} type="number" min="15" step="15" className={`input ${errors.duration_minutes ? 'input-error' : ''}`} placeholder="30" />
                  {errors.duration_minutes && <p className="field-error">{errors.duration_minutes.message}</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? 'Saving…' : editing ? 'Update Service' : 'Add Service'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
