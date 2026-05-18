'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { showToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  BookOpen,
  ArrowUpDown
} from 'lucide-react';

interface Author {
  id: number;
  name: string;
  bio: string | null;
  birth_date: string | null;
  books_count: number;
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

function AuthorsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Authors State
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  // Query/Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Form / Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Create Author');
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null);
  
  // Form input states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Authors Data
  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/authors', {
        params: {
          search: debouncedSearch,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          per_page: perPage,
        },
      });
      setAuthors(response.data.data || []);
      setMeta({
        current_page: response.data.meta?.current_page || 1,
        last_page: response.data.meta?.last_page || 1,
        per_page: response.data.meta?.per_page || 10,
        total: response.data.meta?.total || 0,
      });
    } catch (error) {
      showToast('Failed to fetch authors database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortBy, sortOrder, page, perPage]);

  // Sync data with state filters
  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  // Check URL triggers (e.g. from Dashboard quick action)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      openCreateModal();
      // Remove the query param cleanly
      router.replace('/admin/authors');
    }
  }, [searchParams, router]);

  // Open modal for Create
  const openCreateModal = () => {
    setSelectedAuthorId(null);
    setName('');
    setBio('');
    setBirthDate('');
    setModalTitle('Create Author');
    setModalOpen(true);
  };

  // Open modal for Edit
  const openEditModal = (author: Author) => {
    setSelectedAuthorId(author.id);
    setName(author.name);
    setBio(author.bio || '');
    setBirthDate(author.birth_date || '');
    setModalTitle('Edit Author');
    setModalOpen(true);
  };

  // Form Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Author name is required.', 'error');
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      bio: bio.trim() || null,
      birth_date: birthDate || null,
    };

    try {
      if (selectedAuthorId) {
        // Update
        const response = await api.put(`/authors/${selectedAuthorId}`, payload);
        showToast(response.data.message || 'Author successfully updated!', 'success');
      } else {
        // Create
        const response = await api.post('/authors', payload);
        showToast(response.data.message || 'Author successfully created!', 'success');
      }
      setModalOpen(false);
      fetchAuthors();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save author.';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Action Handler
  const handleDeleteAuthor = async (id: number, authorName: string) => {
    if (confirm(`Are you sure you want to delete "${authorName}"? This will unlink or restrict any books they authored.`)) {
      try {
        const response = await api.delete(`/authors/${id}`);
        showToast(response.data.message || 'Author successfully deleted!', 'success');
        fetchAuthors();
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to delete author.';
        showToast(errorMsg, 'error');
      }
    }
  };

  // Sort toggle helper
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Authors Registry</h2>
          <p className="text-sm text-slate-400 font-medium">Manage biographies and published catalogs of authors.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4.5 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer text-sm"
        >
          <Plus className="h-4.5 w-4.5" /> Add Author
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or biography..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
          />
        </div>

        {/* Entries drop down */}
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <span>Show</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition-all text-slate-800 cursor-pointer font-bold"
          >
            <option value={10}>10 entries</option>
            <option value={25}>25 entries</option>
            <option value={50}>50 entries</option>
          </select>
        </div>
      </div>

      {/* Authors Catalog Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 flex justify-center items-center">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
          ) : authors.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
              <Users className="h-12 w-12 text-slate-200" />
              <p className="text-sm font-bold text-slate-500">No authors found in catalog.</p>
              <button
                onClick={openCreateModal}
                className="text-xs font-bold text-indigo-600 hover:underline mt-1 cursor-pointer"
              >
                Add the first author now
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th
                    onClick={() => handleSort('id')}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      ID <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </span>
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      Author Name <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </span>
                  </th>
                  <th className="px-6 py-4.5">Biography</th>
                  <th
                    onClick={() => handleSort('birth_date')}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      Birth Date <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </span>
                  </th>
                  <th className="px-6 py-4.5">Books Count</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-700">
                {authors.map((author) => (
                  <tr key={author.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">#{author.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{author.name}</td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={author.bio || ''}>
                      {author.bio || <span className="italic text-slate-300">No biography provided</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {author.birth_date ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" /> {author.birth_date}
                        </span>
                      ) : (
                        <span className="italic text-slate-350">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> {author.books_count} books
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => openEditModal(author)}
                          className="p-2 rounded-lg text-slate-450 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAuthor(author.id, author.name)}
                          className="p-2 rounded-lg text-slate-450 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {!loading && authors.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm font-semibold text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{((page - 1) * perPage) + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(page * perPage, meta.total)}</span> of{' '}
              <span className="font-bold text-slate-800">{meta.total}</span> authors
            </div>

            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              
              {/* Simple page numbers */}
              {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.last_page || Math.abs(p - page) <= 1)
                .map((p, index, arr) => (
                  <React.Fragment key={p}>
                    {index > 0 && arr[index - 1] !== p - 1 && <span className="px-1 text-slate-300">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        page === p
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                          : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}

              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Modal Form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Author Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Stephen King"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Birth Date</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Biography</label>
            <textarea
              placeholder="Provide a brief summary of the author's legacy..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Save Author</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function AuthorsPage() {
  return (
    <Suspense fallback={
      <div className="p-16 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    }>
      <AuthorsContent />
    </Suspense>
  );
}
