// src/app/layout.tsx
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/Providers';
import './globals.css';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: { default: 'Appointly', template: '%s | Appointly' },
  description: 'Book appointments with local service providers in Dhaka — salons, clinics, laundry, consultancy, tuition and more.',
  keywords: ['appointment booking', 'dhaka', 'salon', 'clinic', 'tuition', 'booking system'],
  openGraph: {
    title: 'Appointly',
    description: 'Book local services in Dhaka easily.',
    url: 'https://appointly.com.bd',
    siteName: 'Appointly',
    locale: 'en_BD',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans h-full bg-gray-50 text-gray-900 antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '10px', background: '#1e293b', color: '#f8fafc', fontSize: '14px' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
