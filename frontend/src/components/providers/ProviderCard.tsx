'use client';
// src/components/providers/ProviderCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Clock, Heart } from 'lucide-react';
import { ProviderProfile } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { favoriteApi } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props { provider: ProviderProfile; isFavorited?: boolean; }

export function ProviderCard({ provider, isFavorited: initialFav = false }: Props) {
  const { isAuthenticated } = useAuthStore();
  const [favorited, setFavorited] = useState(initialFav);
  const qc = useQueryClient();

  const { mutate: toggleFav } = useMutation({
    mutationFn: () => favoriteApi.toggle(provider.id),
    onMutate: () => setFavorited(f => !f),
    onSuccess: (data) => {
      toast.success(data.data.message);
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => setFavorited(f => !f),
  });

  const lowestPrice = provider.services?.reduce((min, s) => Math.min(min, s.price ?? Infinity), Infinity);

  return (
    <div className="card-hover overflow-hidden group flex flex-col">
      {/* Cover image */}
      <div className="relative h-44 bg-gradient-to-br from-brand-100 to-brand-200 overflow-hidden">
        {provider.cover_image ? (
          <Image src={provider.cover_image} alt={provider.business_name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-30">🏪</span>
          </div>
        )}
        {/* Favorite button */}
        {isAuthenticated && (
          <button
            onClick={(e) => { e.preventDefault(); toggleFav(); }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
          >
            <Heart size={15} className={favorited ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
          </button>
        )}
        {/* Category badge */}
        <div className="absolute bottom-3 left-3">
          <span className="badge bg-white/90 backdrop-blur-sm border-0 text-gray-700 text-xs">
            {provider.category?.name}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-1">
            {provider.business_name}
          </h3>
          {provider.description && (
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{provider.description}</p>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-gray-400 shrink-0" />
            <span className="truncate">{provider.neighborhood?.name}, {provider.neighborhood?.corporation}</span>
          </div>
          {lowestPrice !== Infinity && (
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-gray-400 shrink-0" />
              <span>From {formatCurrency(lowestPrice)}</span>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={13} className={s <= Math.round(provider.average_rating) ? 'star-filled fill-amber-400' : 'star-empty fill-gray-100'} />
            ))}
          </div>
          <span className="text-xs font-medium text-gray-700">{provider.average_rating > 0 ? provider.average_rating.toFixed(1) : 'New'}</span>
          {provider.total_reviews > 0 && <span className="text-xs text-gray-400">({provider.total_reviews})</span>}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-2">
          <Link
            href={`/providers/${provider.business_slug}`}
            className="btn-primary w-full justify-center"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}