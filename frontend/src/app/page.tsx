'use client';

import React from 'react';
import Link from 'next/link';
import { BookMarked, ArrowRight, ShieldCheck, Users2, Database, Library } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Decorative Top Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-violet-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-150">
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight text-lg">PubSystem</h1>
            <p className="text-[9px] text-indigo-600 font-semibold uppercase tracking-wider">Management Console</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login?tab=register"
            className="bg-indigo-600 text-white text-sm font-semibold px-4.5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all hover:scale-[1.02]"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 lg:py-20 flex-grow flex flex-col items-center justify-center text-center gap-12">
        <div className="flex flex-col items-center gap-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide">
            <ShieldCheck className="h-4 w-4" /> Secure JWT Admin Console
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none">
            The next generation of{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Digital Publishing
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-500 max-w-2xl font-normal leading-relaxed">
            Manage your authors, publishers, and catalogs in real-time with our beautiful, highly optimized administrative console. Powered by Laravel 12 and Next.js.
          </p>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link
            href="/admin/dashboard"
            className="bg-slate-900 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 hover:translate-x-0.5"
          >
            Go to Admin Dashboard <ArrowRight className="h-5 w-5 text-indigo-400" />
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-8">
          <div className="bg-white border border-slate-100 p-6.5 rounded-2xl shadow-sm text-left flex flex-col gap-4 hover:shadow-md transition-all">
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl w-fit">
              <Users2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Author Management</h3>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                Seamlessly list, create, update, and manage authors. Detail biographies and connected catalog works instantly.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6.5 rounded-2xl shadow-sm text-left flex flex-col gap-4 hover:shadow-md transition-all">
            <div className="bg-violet-50 text-violet-600 p-3 rounded-xl w-fit">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Publisher Catalogs</h3>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                Connect and manage multiple publishing houses with comprehensive directories, full addresses, and contact indices.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6.5 rounded-2xl shadow-sm text-left flex flex-col gap-4 hover:shadow-md transition-all">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl w-fit">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Book Inventory</h3>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                Refined catalogs showcasing titles, descriptions, pricing, and stock metrics, mapped to authors and publishers.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p>&copy; 2026 Dinar Abdul Hollik Firdaus</p>
      </footer>
    </div>
  );
}
