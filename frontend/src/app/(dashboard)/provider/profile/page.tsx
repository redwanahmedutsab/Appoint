'use client';
// src/app/(dashboard)/provider/profile/page.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi, api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { ServiceCategory, Neighborhood, ProviderProfile } from '@/types';
import { cn } from '@/lib/utils';

const schema = z.object({
  business_name:   z.string().min(2, 'Business name is required'),
  category_id:     z.coerce.number().min(1, 'Please select a category'),
  neighborhood_id: z.coerce.number().min(1, 'Please select a neighborhood'),
  address:         z.string().min(5, 'Address is required'),
  phone:           z.string().min(10, 'Phone is required'),
  whatsapp:        z.string().optional(),
  description:     z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const statusStyle: Record<string, string> = {
  approved:  'bg-green-50 text-green-700 border-green-100',
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-100',
  rejected:  'bg-red-50 text-red-600 border-red-100',
  suspended: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function ProviderProfilePage() {
  const qc = useQueryClient();

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['provider-profile'],
    queryFn: () => providerApi.myProfile().then(r => r.data.provider as ProviderProfile),
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => (r.data.categories ?? r.data.data ?? []) as ServiceCategory[]),
  });
  const { data: neighborhoods } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => api.get('/neighborhoods').then(r => (r.data.neighborhoods ?? r.data.data ?? []) as Neighborhood[]),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (profileRes) {
      reset({
        business_name:   profileRes.business_name,
        category_id:     profileRes.category_id,
        neighborhood_id: profileRes.neighborhood_id,
        address:         profileRes.address,
        phone:           profileRes.phone,
        whatsapp:        profileRes.whatsapp ?? '',
        description:     profileRes.description ?? '',
      });
    }
  }, [profileRes, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: FormData) => providerApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated!');
      qc.invalidateQueries({ queryKey: ['provider-profile'] });
    },
    onError: () => toast.error('Failed to update profile.'),
  });

  if (isLoading) {
    return <div className="flex flex-col gap-4">{[1,2,3].map(i => <div key={i} className="card p-5 skeleton h-16" />)}</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Business Profile</h1>
          <p className="text-gray-500 mt-1">Your public-facing business information.</p>
        </div>
        {profileRes?.approval_status && (
          <span className={cn('badge border text-xs capitalize', statusStyle[profileRes.approval_status] ?? 'bg-gray-50 text-gray-500 border-gray-200')}>
            {profileRes.approval_status}
          </span>
        )}
      </div>

      {profileRes?.rejection_reason && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <span className="font-semibold">Rejection reason: </span>{profileRes.rejection_reason}
        </div>
      )}

      <div className="card p-6 md:p-8">
        <form onSubmit={handleSubmit(d => save(d))} className="flex flex-col gap-5">
          <div>
            <label className="label">Business Name</label>
            <input {...register('business_name')} className={`input ${errors.business_name ? 'input-error' : ''}`} />
            {errors.business_name && <p className="field-error">{errors.business_name.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select {...register('category_id')} className={`input ${errors.category_id ? 'input-error' : ''}`}>
                <option value="">Select category</option>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <p className="field-error">{errors.category_id.message}</p>}
            </div>
            <div>
              <label className="label">Neighborhood</label>
              <select {...register('neighborhood_id')} className={`input ${errors.neighborhood_id ? 'input-error' : ''}`}>
                <option value="">Select neighborhood</option>
                {categories?.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                {neighborhoods?.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              {errors.neighborhood_id && <p className="field-error">{errors.neighborhood_id.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input {...register('address')} className={`input ${errors.address ? 'input-error' : ''}`} />
            {errors.address && <p className="field-error">{errors.address.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Tell customers about your business…" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className={`input ${errors.phone ? 'input-error' : ''}`} />
              {errors.phone && <p className="field-error">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="label">WhatsApp <span className="text-gray-400 font-normal">(optional)</span></label>
              <input {...register('whatsapp')} className="input" />
            </div>
          </div>
          <button type="submit" disabled={isPending} className="btn-primary justify-center disabled:opacity-50">
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}