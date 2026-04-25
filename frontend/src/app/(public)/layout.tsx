// src/app/(public)/layout.tsx
import { PublicNav } from '@/components/layout/PublicNav';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
