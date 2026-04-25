// src/app/(public)/page.tsx
import Link from 'next/link';
import { Metadata } from 'next';
import { Search, Star, Shield, Clock, ChevronRight, Scissors, Stethoscope, BookOpen, Briefcase, Shirt } from 'lucide-react';

export const metadata: Metadata = { title: 'Appointly — Book Local Services in Dhaka' };

const categories = [
  { name: 'Salons & Parlours',       slug: 'salons-parlours',       icon: Scissors,     color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { name: 'Clinics & Diagnostics',   slug: 'clinics-diagnostics',   icon: Stethoscope,  color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { name: 'Laundry & Dry Cleaning',  slug: 'laundry-dry-cleaning',  icon: Shirt,        color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  { name: 'Consultancy Services',    slug: 'consultancy-services',  icon: Briefcase,    color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { name: 'Tuition & Coaching',      slug: 'tuition-coaching',      icon: BookOpen,     color: 'bg-violet-50 text-violet-600 border-violet-100' },
];

const features = [
  { icon: Search,  title: 'Discover Providers',  desc: 'Find trusted local service providers across Dhaka — filtered by area, rating, and price.' },
  { icon: Clock,   title: 'Book Instantly',       desc: 'Choose your slot and confirm your appointment in under 2 minutes. No phone calls needed.' },
  { icon: Star,    title: 'Verified Reviews',     desc: 'Every rating comes from a real completed booking. Find providers you can trust.' },
  { icon: Shield,  title: 'Safe & Reliable',      desc: 'Providers are manually vetted before approval. Your experience is our priority.' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-16 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-accent-500 blur-3xl" />
        </div>

        <div className="relative page-container py-24 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Now serving Dhaka North & South City
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold font-display leading-tight mb-6 text-balance">
              Book Local Services<br />
              <span className="text-brand-300">Instantly in Dhaka</span>
            </h1>
            <p className="text-lg text-brand-100 mb-10 max-w-xl leading-relaxed">
              Salons, clinics, laundry, consultancy, tuition — discover and book trusted local providers in your neighbourhood.
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-elevated">
                <Search className="text-gray-400 shrink-0" size={18} />
                <input
                  type="text"
                  placeholder="Search services or providers…"
                  className="flex-1 text-gray-900 placeholder-gray-400 text-sm focus:outline-none bg-transparent"
                />
              </div>
              <Link
                href="/providers"
                className="btn-primary btn-lg whitespace-nowrap"
              >
                Find Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────────────── */}
      <section className="py-20 page-container">
        <div className="text-center mb-12">
          <h2 className="section-title mb-3">Browse by Category</h2>
          <p className="text-gray-500">Five service verticals covering your everyday needs</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={`/providers?category=${cat.slug}`}
                className={`card-hover p-6 flex flex-col items-center text-center gap-3 border ${cat.color} group`}
              >
                <div className={`p-3 rounded-2xl ${cat.color} border`}>
                  <Icon size={24} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Why Choose Appointly?</h2>
            <p className="text-gray-500">Built for the people of Dhaka</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card p-6 flex flex-col gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                    <Icon size={20} className="text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20 page-container">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold font-display mb-4">
              Are you a service provider?
            </h2>
            <p className="text-brand-100 mb-8 max-w-md mx-auto">
              List your business on Appointly and start receiving bookings from customers across Dhaka today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/register" className="btn bg-white text-brand-700 hover:bg-brand-50 btn-lg font-bold">
                Get Started Free
              </Link>
              <Link href="/providers" className="btn border border-white/30 text-white hover:bg-white/10 btn-lg">
                Browse Providers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-12">
        <div className="page-container flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2 font-display font-bold text-gray-900 text-lg">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">A</span>
            </div>
            Appointly
          </div>
          <p>© {new Date().getFullYear()} Appointly. Serving Dhaka DNCC &amp; DSCC.</p>
          <div className="flex gap-6">
            <Link href="/providers" className="hover:text-gray-900 transition-colors">Providers</Link>
            <Link href="/auth/login" className="hover:text-gray-900 transition-colors">Login</Link>
            <Link href="/auth/register" className="hover:text-gray-900 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
