'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/components/Toast';
import {
  Users,
  Building2,
  BookOpen,
  ArrowUpRight,
  Plus,
  BookMarked,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface Stats {
  books: number;
  authors: number;
  publishers: number;
}

interface RecentBook {
  id: number;
  title: string;
  author_name: string;
  publisher_name: string;
  price: number;
  stock: number;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ books: 0, authors: 0, publishers: 0 });
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch paginated endpoints with per_page=1 to get total count from meta pagination!
        const [booksRes, authorsRes, publishersRes] = await Promise.all([
          api.get('/books', { params: { per_page: 1 } }),
          api.get('/authors', { params: { per_page: 1 } }),
          api.get('/publishers', { params: { per_page: 1 } }),
        ]);

        const totalBooks = booksRes.data.meta?.total || 0;
        const totalAuthors = authorsRes.data.meta?.total || 0;
        const totalPublishers = publishersRes.data.meta?.total || 0;

        setStats({
          books: totalBooks,
          authors: totalAuthors,
          publishers: totalPublishers,
        });

        // Fetch recent books (page 1, per_page 5, sorted by created_at desc)
        const recentRes = await api.get('/books', {
          params: { per_page: 5, sort_by: 'created_at', sort_order: 'desc' },
        });
        setRecentBooks(recentRes.data.data || []);
      } catch (err: any) {
        showToast('Failed to load dashboard statistics.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      name: 'Total Authors',
      value: stats.authors,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-100',
      link: '/admin/authors',
    },
    {
      name: 'Publishing Houses',
      value: stats.publishers,
      icon: Building2,
      color: 'from-violet-500 to-fuchsia-600',
      shadow: 'shadow-violet-100',
      link: '/admin/publishers',
    },
    {
      name: 'Active Catalog Books',
      value: stats.books,
      icon: BookOpen,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-100',
      link: '/admin/books',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Premium Header Greeting */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-8 lg:p-10 text-white relative overflow-hidden shadow-xl shadow-indigo-950/20">
        {/* Decorative elements */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        <div className="absolute left-1/3 top-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-wide border border-indigo-400/10 w-fit">
              <Sparkles className="h-3.5 w-3.5" /> Workspace overview
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Administrator'}!
            </h2>
            <p className="text-indigo-200/70 text-sm max-w-lg leading-relaxed mt-1">
              Your digital publishing database is healthy and synced. Monitor authors, publishers, and catalogs all from one streamlined console.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/books"
              className="bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-bold px-5 py-3 rounded-xl transition-all hover:scale-[1.02]"
            >
              View Catalog
            </Link>
            <Link
              href="/admin/books?action=new"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg shadow-indigo-900/40 transition-all hover:scale-[1.02] flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add New Book
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative group hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {card.name}
                </span>
                {loading ? (
                  <div className="h-9 w-16 bg-slate-100 animate-pulse rounded-lg mt-1" />
                ) : (
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                    {card.value}
                  </h3>
                )}
                <Link
                  href={card.link}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2 transition-colors"
                >
                  Manage database <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className={`bg-gradient-to-tr ${card.color} p-4 rounded-2xl text-white shadow-lg ${card.shadow} group-hover:scale-105 transition-transform duration-300`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Layout for Recent Books and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Books List */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 tracking-tight">Recently Added Books</h3>
            </div>
            <Link
              href="/admin/books"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 flex flex-col gap-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 bg-slate-50 animate-pulse rounded-xl w-full" />
                ))}
              </div>
            ) : recentBooks.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <BookMarked className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">No books found in catalog.</p>
                <Link
                  href="/admin/books"
                  className="text-xs font-bold text-indigo-600 mt-1 hover:underline"
                >
                  Create one now
                </Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 text-sm">{book.title}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{book.author_name}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700 text-sm">
                        ${Number(book.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            book.stock > 10
                              ? 'bg-emerald-50 text-emerald-700'
                              : book.stock > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {book.stock} left
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Database Insights Widget */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 tracking-tight">Database Metrics</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Books per Author Ratio</span>
              <span className="font-bold text-slate-850">
                {stats.authors > 0 ? (stats.books / stats.authors).toFixed(1) : 0}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${Math.min(100, stats.authors > 0 ? (stats.books / stats.authors) * 10 : 0)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-500">Books per Publisher Ratio</span>
              <span className="font-bold text-slate-850">
                {stats.publishers > 0 ? (stats.books / stats.publishers).toFixed(1) : 0}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-violet-600 h-full rounded-full"
                style={{ width: `${Math.min(100, stats.publishers > 0 ? (stats.books / stats.publishers) * 10 : 0)}%` }}
              />
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Add New Entities
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/authors?action=new"
                className="flex items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-150 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Author
              </Link>
              <Link
                href="/admin/publishers?action=new"
                className="flex items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-150 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Publisher
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
