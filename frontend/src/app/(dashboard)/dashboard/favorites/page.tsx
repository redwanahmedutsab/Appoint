'use client';
// src/app/(dashboard)/dashboard/favorites/page.tsx
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function FavoritesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Favourites</h1>
        <p className="text-gray-500 mt-1">Providers you've saved for easy access.</p>
      </div>
      <div className="card p-16 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Heart size={28} className="text-red-400" />
        </div>
        <h3 className="font-semibold text-gray-700 mb-2">No favourites yet</h3>
        <p className="text-sm text-gray-400 mb-5">Browse services and tap the heart icon to save providers here.</p>
        <Link href="/providers" className="btn-primary">Browse Providers</Link>
      </div>
    </div>
  );
}
