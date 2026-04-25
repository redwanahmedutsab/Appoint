'use client';
// src/app/(public)/providers/page.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { lookupApi, providerApi } from '@/lib/api';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ServiceCategory, Neighborhood, ProviderProfile, PaginatedResponse } from '@/types';

export default function ProvidersPage() {
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [minRating, setMinRating]     = useState('');
  const [sort, setSort]               = useState('');
  const [page, setPage]               = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => lookupApi.categories().then(r => r.data.categories as ServiceCategory[]),
  });

  const { data: neighborhoodsData } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => lookupApi.neighborhoods().then(r => r.data.neighborhoods as Neighborhood[]),
  });

  const params = { search: search || undefined, category: category || undefined, neighborhood: neighborhood || undefined, min_rating: minRating || undefined, sort: sort || undefined, page };

  const { data, isLoading } = useQuery({
    queryKey: ['providers', params],
    queryFn: () => providerApi.list(params).then(r => r.data as PaginatedResponse<ProviderProfile>),
    placeholderData: (prev) => prev,
  });

  const clearFilters = () => { setSearch(''); setCategory(''); setNeighborhood(''); setMinRating(''); setSort(''); setPage(1); };
  const hasFilters = search || category || neighborhood || minRating || sort;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">Find Service Providers</h1>
          <p className="text-gray-500">Trusted local businesses across Dhaka DNCC &amp; DSCC</p>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-2.5 shadow-card">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search business name or service…"
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
            />
            {search && <button onClick={() => setSearch('')}><X size={14} className="text-gray-400" /></button>}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary gap-2 ${hasFilters ? 'border-brand-300 text-brand-700 bg-brand-50' : ''}`}
          >
            <SlidersHorizontal size={15} />
            Filters {hasFilters ? '•' : ''}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-red-500 hover:bg-red-50">
              Clear All
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-down">
            <div>
              <label className="label">Category</label>
              <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="input">
                <option value="">All Categories</option>
                {categoriesData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Neighbourhood</label>
              <select value={neighborhood} onChange={e => { setNeighborhood(e.target.value); setPage(1); }} className="input">
                <option value="">All Areas</option>
                {neighborhoodsData?.map(n => <option key={n.id} value={n.id}>{n.name} ({n.corporation})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Minimum Rating</label>
              <select value={minRating} onChange={e => { setMinRating(e.target.value); setPage(1); }} className="input">
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>
            <div>
              <label className="label">Sort By</label>
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="input">
                <option value="">Best Rated</option>
                <option value="bookings">Most Booked</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="skeleton h-40 mb-4 rounded-xl" />
                <div className="skeleton h-4 w-2/3 mb-2" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No providers found</h3>
            <p className="text-gray-500">Try different filters or search terms</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{data?.total} provider{data?.total !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.data.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>

            {/* Pagination */}
            {(data?.last_page ?? 1) > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-40">Prev</button>
                <span className="text-sm text-gray-600">Page {page} of {data?.last_page}</span>
                <button disabled={page === data?.last_page} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-40">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
