'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { showToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Users,
  Building2,
  ArrowUpDown,
  Tag
} from 'lucide-react';

interface Book {
  id: number;
  title: string;
  description: string | null;
  release_date: string | null;
  stock: number;
  price: number;
  author_id: number;
  publisher_id: number;
  author_name: string;
  publisher_name: string;
}

interface AuthorOption {
  id: number;
  name: string;
}

interface PublisherOption {
  id: number;
  name: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

function BooksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Books and options States
  const [books, setBooks] = useState<Book[]>([]);
  const [authorsList, setAuthorsList] = useState<AuthorOption[]>([]);
  const [publishersList, setPublishersList] = useState<PublisherOption[]>([]);
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
  const [authorFilter, setAuthorFilter] = useState('');
  const [publisherFilter, setPublisherFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Form / Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Create Book');
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  
  // Form input states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [price, setPrice] = useState<string>('0.00');
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('');
  const [selectedPublisherId, setSelectedPublisherId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Books
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/books', {
        params: {
          search: debouncedSearch,
          author_id: authorFilter || undefined,
          publisher_id: publisherFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          per_page: perPage,
        },
      });
      setBooks(response.data.data || []);
      setMeta({
        current_page: response.data.meta?.current_page || 1,
        last_page: response.data.meta?.last_page || 1,
        per_page: response.data.meta?.per_page || 10,
        total: response.data.meta?.total || 0,
      });
    } catch (error) {
      showToast('Failed to fetch books catalog.', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, authorFilter, publisherFilter, sortBy, sortOrder, page, perPage]);

  // Eager fetch authors and publishers options for drop-downs
  const fetchOptions = useCallback(async () => {
    try {
      const [authorsRes, publishersRes] = await Promise.all([
        api.get('/authors', { params: { per_page: 200 } }),
        api.get('/publishers', { params: { per_page: 200 } }),
      ]);
      setAuthorsList(authorsRes.data.data || []);
      setPublishersList(publishersRes.data.data || []);
    } catch (err) {
      showToast('Failed to fetch relation drop-down options.', 'error');
    }
  }, []);

  // Sync data with filter states
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Load options once on mount
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Check URL triggers (e.g. from Dashboard quick action)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      openCreateModal();
      // Remove query param cleanly
      router.replace('/admin/books');
    }
  }, [searchParams, router]);

  // Open modal for Create
  const openCreateModal = () => {
    setSelectedBookId(null);
    setTitle('');
    setDescription('');
    setReleaseDate('');
    setStock(10);
    setPrice('19.99');
    // Default to first option if available, otherwise empty
    setSelectedAuthorId(authorsList[0]?.id?.toString() || '');
    setSelectedPublisherId(publishersList[0]?.id?.toString() || '');
    setModalTitle('Create Book');
    setModalOpen(true);
  };

  // Open modal for Edit
  const openEditModal = (book: Book) => {
    setSelectedBookId(book.id);
    setTitle(book.title);
    setDescription(book.description || '');
    setReleaseDate(book.release_date || '');
    setStock(book.stock);
    setPrice(Number(book.price).toFixed(2));
    setSelectedAuthorId(book.author_id.toString());
    setSelectedPublisherId(book.publisher_id.toString());
    setModalTitle('Edit Book');
    setModalOpen(true);
  };

  // Form Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Book title is required.', 'error');
      return;
    }
    if (!selectedAuthorId) {
      showToast('Author must be selected.', 'error');
      return;
    }
    if (!selectedPublisherId) {
      showToast('Publisher must be selected.', 'error');
      return;
    }

    setSubmitting(true);
    const payload = {
      title,
      description: description.trim() || null,
      release_date: releaseDate || null,
      stock: Number(stock),
      price: Number(price),
      author_id: Number(selectedAuthorId),
      publisher_id: Number(selectedPublisherId),
    };

    try {
      if (selectedBookId) {
        // Update
        const response = await api.put(`/books/${selectedBookId}`, payload);
        showToast(response.data.message || 'Book successfully updated!', 'success');
      } else {
        // Create
        const response = await api.post('/books', payload);
        showToast(response.data.message || 'Book successfully created!', 'success');
      }
      setModalOpen(false);
      fetchBooks();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save book.';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Action Handler
  const handleDeleteBook = async (id: number, bookTitle: string) => {
    if (confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
      try {
        const response = await api.delete(`/books/${id}`);
        showToast(response.data.message || 'Book successfully deleted!', 'success');
        fetchBooks();
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to delete book.';
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
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Active Books Catalog</h2>
          <p className="text-sm text-slate-400 font-medium">Manage pricing, stocks, descriptions, and catalog alignments.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4.5 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer text-sm"
        >
          <Plus className="h-4.5 w-4.5" /> Add Book
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full xl:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
          />
        </div>

        {/* Drop down Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
          
          {/* Author filter */}
          <div className="relative w-full sm:w-48">
            <select
              value={authorFilter}
              onChange={(e) => {
                setAuthorFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
            >
              <option value="">All Authors</option>
              {authorsList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Users className="h-4 w-4" />
            </div>
          </div>

          {/* Publisher filter */}
          <div className="relative w-full sm:w-48">
            <select
              value={publisherFilter}
              onChange={(e) => {
                setPublisherFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
            >
              <option value="">All Publishers</option>
              {publishersList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>

          {/* Entries drop down */}
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-all text-xs text-slate-600 cursor-pointer font-bold w-full sm:w-auto"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Books Catalog Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 flex justify-center items-center">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
          ) : books.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
              <BookOpen className="h-12 w-12 text-slate-200" />
              <p className="text-sm font-bold text-slate-500">No books found matching search parameters.</p>
              <button
                onClick={openCreateModal}
                className="text-xs font-bold text-indigo-600 hover:underline mt-1 cursor-pointer"
              >
                Add a book to catalog
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
                    onClick={() => handleSort('title')}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      Book Title <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </span>
                  </th>
                  <th className="px-6 py-4.5">Author</th>
                  <th className="px-6 py-4.5">Publisher</th>
                  <th
                    onClick={() => handleSort('release_date')}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      Release Date <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </span>
                  </th>
                  <th
                    onClick={() => handleSort('stock')}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      Inventory <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </span>
                  </th>
                  <th
                    onClick={() => handleSort('price')}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      Unit Price <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </span>
                  </th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-700">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">#{book.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col max-w-[200px] overflow-hidden">
                        <span className="font-bold text-slate-800 truncate" title={book.title}>{book.title}</span>
                        <span className="text-xs text-slate-400 truncate mt-0.5" title={book.description || ''}>
                          {book.description || 'No description provided'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                        <Users className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {book.author_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-slate-550">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {book.publisher_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {book.release_date ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {book.release_date}
                        </span>
                      ) : (
                        <span className="italic text-slate-350">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          book.stock > 10
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : book.stock > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}
                      >
                        {book.stock} items left
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      ${Number(book.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => openEditModal(book)}
                          className="p-2 rounded-lg text-slate-450 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id, book.title)}
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
        {!loading && books.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm font-semibold text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{((page - 1) * perPage) + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(page * perPage, meta.total)}</span> of{' '}
              <span className="font-bold text-slate-800">{meta.total}</span> books
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
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Book Title <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. The Shining"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Author Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Assign Author <span className="text-rose-500">*</span></label>
              <select
                value={selectedAuthorId}
                onChange={(e) => setSelectedAuthorId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                required
              >
                <option value="" disabled>Select Author...</option>
                {authorsList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Publisher Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Assign Publisher <span className="text-rose-500">*</span></label>
              <select
                value={selectedPublisherId}
                onChange={(e) => setSelectedPublisherId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                required
              >
                <option value="" disabled>Select Publisher...</option>
                {publishersList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Release Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Release Date</label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Unit Price */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Price (USD) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-450 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Stock volume */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Stock Inventory <span className="text-rose-500">*</span></label>
              <input
                type="number"
                min="0"
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                required
              />
            </div>

          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Catalog Description</label>
            <textarea
              placeholder="Provide a synopsis or marketing review of the book..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
                <span>Save Book</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={
      <div className="p-16 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    }>
      <BooksContent />
    </Suspense>
  );
}
