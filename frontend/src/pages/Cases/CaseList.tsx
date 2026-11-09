import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import api, { formatDate } from '../../services/api'
import { CaseRecord, Category, CaseStatus, User, PaginationMeta } from '../../types'
import { StatusBadge } from '../../components/common/Badge'
import { Pagination } from '../../components/common/Pagination'
import { SkeletonTable } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { ConfirmModal } from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'

export const CaseList: React.FC = () => {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()

  // State
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [officers, setOfficers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & search
  const [search, setSearch] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedOfficer, setSelectedOfficer] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [page, setPage] = useState<number>(1)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<CaseRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Fetch dropdown data (categories and officers)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, offRes] = await Promise.all([
          api.get('/categories'),
          api.get('/officers'),
        ])
        setCategories(catRes.data.data)
        setOfficers(offRes.data.data)
      } catch (err) {
        console.error('Failed to load categories or officers', err)
      }
    }
    fetchMetadata()
  }, [])

  // Fetch cases
  const fetchCases = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('per_page', '15')
      if (search) params.append('search', search)
      if (selectedCategory) params.append('category_id', selectedCategory)
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedOfficer) params.append('officer_id', selectedOfficer)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const res = await api.get(`/cases?${params.toString()}`)
      setCases(res.data.data)
      if (res.data.meta) {
        setMeta(res.data.meta)
      }
    } catch (err: unknown) {
      console.error('Failed to fetch cases', err)
      setError('Gagal memuat daftar kasus dari server.')
    } finally {
      setIsLoading(false)
    }
  }, [page, search, selectedCategory, selectedStatus, selectedOfficer, dateFrom, dateTo])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchCases()
  }

  // Handle Reset filter
  const handleResetFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedStatus('')
    setSelectedOfficer('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await api.delete(`/cases/${deleteTarget.id}`)
      setFeedbackMessage({
        type: 'success',
        text: `Kasus nomor ${deleteTarget.case_number} berhasil dihapus.`,
      })
      setDeleteTarget(null)
      fetchCases()
    } catch (err: unknown) {
      let msg = 'Gagal menghapus kasus.'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } }
        msg = axiosErr.response?.data?.message || msg
      }
      setFeedbackMessage({ type: 'error', text: msg })
    } finally {
      setIsDeleting(false)
    }
  }

  const canEdit = hasRole(['admin', 'operator', 'penyidik'])
  const canDelete = hasRole(['admin'])

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Daftar &amp; Registrasi Kasus
          </h1>
        </div>

        {canEdit && (
          <Link
            to="/cases/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Tambah Kasus Baru</span>
          </Link>
        )}
      </div>

      {/* Feedback Alert Toast */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor kasus, nama pelapor, atau kronologi..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
          >
            Cari
          </button>
        </form>

        {/* Detailed Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Kategori Kejahatan
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setPage(1)
              }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Status Kasus
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(1)
              }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="laporan_masuk">Laporan Masuk</option>
              <option value="dalam_penyelidikan">Dalam Penyelidikan</option>
              <option value="dalam_penyidikan">Dalam Penyidikan</option>
              <option value="p21">P-21</option>
              <option value="sp3">SP3</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>

          {/* Officer */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Petugas Penangan
            </label>
            <select
              value={selectedOfficer}
              onChange={(e) => {
                setSelectedOfficer(e.target.value)
                setPage(1)
              }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Petugas</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Tgl Laporan Dari
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end gap-1.5">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Sampai Tgl
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filter"
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={10} cols={8} />
        ) : cases.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <th className="py-3.5 px-4">No. Kasus</th>
                    <th className="py-3.5 px-4">Tgl Laporan</th>
                    <th className="py-3.5 px-4">Nama Pelapor</th>
                    <th className="py-3.5 px-4">Kategori &amp; Modus</th>
                    <th className="py-3.5 px-4">Kerugian Material</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Petugas</th>
                    <th className="py-3.5 px-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {cases.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 whitespace-nowrap">
                        <Link
                          to={`/cases/${c.id}`}
                          className="hover:underline"
                        >
                          {c.case_number}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {formatDate(c.report_date)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {c.reporter_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {c.category?.name || '-'}
                        </div>
                        {c.subcategory && (
                          <div className="text-[11px] text-slate-500">
                            {c.subcategory.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {c.material_loss_formatted}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {c.officer?.name || (
                          <span className="text-slate-400 italic">Belum ditunjuk</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/cases/${c.id}`}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Lihat Detail Berkas"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>

                          {canEdit && (
                            <Link
                              to={`/cases/${c.id}/edit`}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Edit Kasus"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </Link>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(c)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Hapus Kasus (Admin)"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
          </>
        ) : (
          <EmptyState
            title="Tidak ada berkas kasus ditemukan"
            description="Tidak ada data yang sesuai dengan kata kunci pencarian atau filter yang dipilih."
            actionLabel={canEdit ? 'Registrasi Kasus Baru' : undefined}
            onAction={canEdit ? () => navigate('/cases/new') : undefined}
            isSearch={!!search || !!selectedCategory || !!selectedStatus}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Penghapusan Kasus"
        message={`Apakah Anda yakin ingin menghapus kasus nomor "${deleteTarget?.case_number}" atas pelapor "${deleteTarget?.reporter_name}"? Tindakan ini akan dicatat dalam Audit Log dan hanya dapat dipulihkan melalui database.`}
        confirmText="Hapus Kasus"
        cancelText="Batal"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  )
}
