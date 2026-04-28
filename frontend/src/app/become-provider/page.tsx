'use client';
// src/app/become-provider/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { providerApi } from '@/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Building2, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ServiceCategory, Neighborhood } from '@/types';

const schema = z.object({
  business_name:    z.string().min(2, 'Business name is required'),
  category_id:      z.coerce.number().min(1, 'Please select a category'),
  neighborhood_id:  z.coerce.number().min(1, 'Please select a neighborhood'),
  address:          z.string().min(5, 'Full address is required'),
  phone:            z.string().min(10, 'Valid phone number is required'),
  whatsapp:         z.string().optional(),
  description:      z.string().min(20, 'Description must be at least 20 characters'),
});
type BecomeProviderForm = z.infer<typeof schema>;

export default function BecomeProviderPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user?.role === 'provider') { router.push('/provider/dashboard'); return; }
    if (user?.role === 'admin')    { router.push('/admin'); return; }
  }, [isAuthenticated, user, router]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => (r.data.categories ?? r.data.data ?? []) as ServiceCategory[]),
  });
  const { data: neighborhoods } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => api.get('/neighborhoods').then(r => (r.data.neighborhoods ?? r.data.data ?? []) as Neighborhood[]),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<BecomeProviderForm>({
    resolver: zodResolver(schema),
  });

  const [submitted, setSubmitted] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: BecomeProviderForm) => providerApi.becomeProvider(data),
    onSuccess: () => setSubmitted(true),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to submit application. Please try again.');
    },
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold font-display text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Your provider application is under review. We'll notify you once it's approved — usually within 24–48 hours.
          </p>
          <Link href="/dashboard" className="btn-primary w-full justify-center">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold font-display text-gray-900">Become a Provider</h1>
          </div>
          <p className="text-gray-500 ml-13">List your business on Appointly and start receiving bookings today.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card p-6 md:p-8">
          <form onSubmit={handleSubmit(d => mutate(d))} className="flex flex-col gap-5">

            {/* Business Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Business Information</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="label">Business Name</label>
                  <input {...register('business_name')} className={`input ${errors.business_name ? 'input-error' : ''}`} placeholder="e.g. Hasan's Salon" />
                  {errors.business_name && <p className="field-error">{errors.business_name.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category</label>
                    <select {...register('category_id')} className={`input ${errors.category_id ? 'input-error' : ''}`}>
                      <option value="">Select a category</option>
                      {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.category_id && <p className="field-error">{errors.category_id.message}</p>}
                  </div>
                  <div>
                    <label className="label">Neighborhood</label>
                    <select {...register('neighborhood_id')} className={`input ${errors.neighborhood_id ? 'input-error' : ''}`}>
                      <option value="">Select neighborhood</option>
                      {neighborhoods?.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                    {errors.neighborhood_id && <p className="field-error">{errors.neighborhood_id.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="label">Full Address</label>
                  <input {...register('address')} className={`input ${errors.address ? 'input-error' : ''}`} placeholder="House/Road/Area" />
                  {errors.address && <p className="field-error">{errors.address.message}</p>}
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea {...register('description')} rows={3} className={`input resize-none ${errors.description ? 'input-error' : ''}`} placeholder="Tell customers about your business, experience, and services…" />
                  {errors.description && <p className="field-error">{errors.description.message}</p>}
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone Number</label>
                  <input {...register('phone')} className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="01XXXXXXXXX" />
                  {errors.phone && <p className="field-error">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="label">WhatsApp <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input {...register('whatsapp')} className="input" placeholder="01XXXXXXXXX" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isPending} className="btn-primary justify-center disabled:opacity-50 mt-2">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {isPending ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}