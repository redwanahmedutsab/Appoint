'use client';
// src/app/(dashboard)/admin/categories/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Plus, Pencil, ToggleLeft, ToggleRight, Layers, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ServiceCategory } from '@/types';
import { cn } from '@/lib/utils';

const schema = z.object({
  name:        z.string().min(2, 'Name is required'),
  icon:        z.string().optional(),
  description: z.string().optional(),
  sort_order:  z.coerce.number().min(0).default(0),
});
type FormData = z.infer<typeof schema>;

export default function AdminCategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<ServiceCategory | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.categories().then(r => r.data.data as ServiceCategory[]),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => {
    reset({ name: '', icon: '', description: '', sort_order: 0 });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (c: ServiceCategory) => {
    reset({ name: c.name, icon: c.icon ?? '', description: c.description ?? '', sort_order: c.sort_order });
    setEditing(c);
    setShowForm(true);
  };

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (data: FormData) =>
      editing ? adminApi.updateCategory(editing.id, data) : adminApi.createCategory(data),
    onSuccess: () => {
      toast.success(editing ? 'Category updated!' : 'Category created!');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowForm(false);
      setEditing(null);
    },
    onError: () => toast.error('Failed to save category.'),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: (c: ServiceCategory) => adminApi.updateCategory(c.id, { is_active: !c.is_active }),
    onSuccess: () => { toast.success('Category updated.'); qc.invalidateQueries({ queryKey: ['admin-categories'] }); },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Manage service categories that providers can list under.</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card p-5 skeleton h-24" />)}
        </div>
      ) : data?.length === 0 ? (
        <div className="card p-16 text-center">
          <Layers size={40} className="mx-auto mb-3 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-2">No categories yet</h3>
          <p className="text-sm text-gray-400 mb-4">Add your first service category to get started.</p>
          <button onClick={openCreate} className="btn-primary">Add Category</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((c: ServiceCategory) => (
            <div key={c.id} className={cn('card p-5 flex flex-col gap-3 transition-opacity', !c.is_active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {c.icon && <span className="text-2xl">{c.icon}</span>}
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">/{c.slug}</p>
                  </div>
                </div>
                <span className={cn(
                  'badge border text-xs shrink-0',
                  c.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                )}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                <button onClick={() => openEdit(c)} className="btn-ghost btn-sm gap-1">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => toggle(c)} className="btn-ghost btn-sm gap-1 text-gray-500">
                  {c.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                  {c.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editing ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSubmit(d => save(d))} className="flex flex-col gap-4">
              <div>
                <label className="label">Category Name</label>
                <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Hair & Beauty" />
                {errors.name && <p className="field-error">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Icon <span className="text-gray-400 font-normal">(emoji)</span></label>
                  <input {...register('icon')} className="input" placeholder="✂️" />
                </div>
                <div>
                  <label className="label">Sort Order</label>
                  <input {...register('sort_order')} type="number" min="0" className="input" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea {...register('description')} rows={2} className="input resize-none" placeholder="Brief description…" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                  className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
