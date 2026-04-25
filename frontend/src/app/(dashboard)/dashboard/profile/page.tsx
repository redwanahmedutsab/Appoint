'use client';
// src/app/(dashboard)/dashboard/profile/page.tsx
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Loader2, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { getInitials } from '@/lib/utils';

const profileSchema = z.object({
  name:  z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
});
const passwordSchema = z.object({
  current_password:      z.string().min(1, 'Current password is required'),
  password:              z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: "Passwords don't match", path: ['password_confirmation'],
});

type ProfileForm  = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  const { register: rp, handleSubmit: hp, formState: { errors: ep } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  });

  const { register: rw, handleSubmit: hw, reset: resetPw, formState: { errors: ew } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    mutationFn: (data: ProfileForm) => authApi.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.data.user);
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile.'),
  });

  const { mutate: changePassword, isPending: changingPw } = useMutation({
    mutationFn: (data: PasswordForm) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed!');
      resetPw();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to change password.');
    },
  });

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account details and password.</p>
      </div>

      {/* Avatar */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {user ? getInitials(user.name) : '?'}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="badge bg-brand-50 text-brand-700 border border-brand-100 text-xs mt-1 inline-block capitalize">{user?.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(['profile', 'password'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab === 'profile' ? <><User size={14} className="inline mr-1.5" />Profile</> : <><Lock size={14} className="inline mr-1.5" />Password</>}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6">
          <form onSubmit={hp(d => saveProfile(d))} className="flex flex-col gap-4">
            <div>
              <label className="label">Full Name</label>
              <input {...rp('name')} className={`input ${ep.name ? 'input-error' : ''}`} />
              {ep.name && <p className="field-error">{ep.name.message}</p>}
            </div>
            <div>
              <label className="label">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <input {...rp('phone')} className="input" placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={user?.email ?? ''} disabled className="input bg-gray-50 text-gray-400 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary justify-center disabled:opacity-50">
              {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card p-6">
          <form onSubmit={hw(d => changePassword(d))} className="flex flex-col gap-4">
            <div>
              <label className="label">Current Password</label>
              <input {...rw('current_password')} type="password" className={`input ${ew.current_password ? 'input-error' : ''}`} />
              {ew.current_password && <p className="field-error">{ew.current_password.message}</p>}
            </div>
            <div>
              <label className="label">New Password</label>
              <input {...rw('password')} type="password" className={`input ${ew.password ? 'input-error' : ''}`} />
              {ew.password && <p className="field-error">{ew.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input {...rw('password_confirmation')} type="password" className={`input ${ew.password_confirmation ? 'input-error' : ''}`} />
              {ew.password_confirmation && <p className="field-error">{ew.password_confirmation.message}</p>}
            </div>
            <button type="submit" disabled={changingPw} className="btn-primary justify-center disabled:opacity-50">
              {changingPw ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              {changingPw ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
