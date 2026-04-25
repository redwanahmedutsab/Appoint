'use client';
// src/app/auth/register/page.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({
  name:                  z.string().min(2, 'Name must be at least 2 characters'),
  email:                 z.string().email('Invalid email address'),
  phone:                 z.string().optional(),
  password:              z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, { message: 'Passwords do not match', path: ['password_confirmation'] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.register(data),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.token);
      toast.success('Account created! Welcome to Appointly 🎉');
      router.push('/dashboard');
    },
    onError: (err: any) => {
      const errors = err.response?.data?.errors;
      if (errors?.email) { toast.error(errors.email[0]); return; }
      toast.error(err.response?.data?.message || 'Registration failed.');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-display font-bold text-2xl text-gray-900">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-black">A</span>
            </div>
            Appointly
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-6 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500">Start booking local services today</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit(d => mutate(d))} className="flex flex-col gap-4">
            <div>
              <label className="label">Full Name</label>
              <input {...register('name')} placeholder="Redwan Ahmed" className={`input ${errors.name ? 'input-error' : ''}`} />
              {errors.name && <p className="field-error">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email Address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className={`input ${errors.email ? 'input-error' : ''}`} />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <input {...register('phone')} placeholder="01XXXXXXXXX" className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" className={`input pr-10 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input {...register('password_confirmation')} type="password" placeholder="Re-enter password" className={`input ${errors.password_confirmation ? 'input-error' : ''}`} />
              {errors.password_confirmation && <p className="field-error">{errors.password_confirmation.message}</p>}
            </div>
            <button type="submit" disabled={isPending} className="btn-primary btn-lg w-full justify-center mt-2">
              <UserPlus size={16} />
              {isPending ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
