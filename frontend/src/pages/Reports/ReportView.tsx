import React, { useState, useEffect, useCallback } from 'react'
import {
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ArrowPathIcon,
  BanknotesIcon,
  FolderOpenIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import api, { API_BASE_URL, formatRupiah, formatDate } from '../../services/api'
import {
  Category,
  Subcategory,
  User,
  CaseRecord,
  PaginationMeta,
  ReportData,
} from '../../types'
import { StatusBadge } from '../../components/common/Badge'
import { Pagination } from '../../components/common/Pagination'
import { SkeletonTable } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'

export const ReportView: React.FC = () => {
  // Report state
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isExporting, setIsExporting] = useState<'pdf' | 'xlsx' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedOfficer, setSelectedOfficer] = useState<string>('')
  const [page, setPage] = useState<number>(1)

  // Metadata dropdowns
  const [categories, setCategories] = useState<Category[]>([])
  const [availableSubs, setAvailableSubs] = useState<Subcategory[]>([])
  const [officers, setOfficers] = useState<User[]>([])

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
        console.error('Error fetching metadata', err)
      }
    }
    fetchMetadata()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      const selected = categories.find((c) => c.id.toString() === selectedCategory)
      setAvailableSubs(selected?.subcategories || [])
    } else {
      setAvailableSubs([])
      setSelectedSubcategory('')
    }
  }, [selectedCategory, categories])

  // Build query string
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('per_page', '15')
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    if (selectedCategory) params.append('category_id', selectedCategory)
    if (selectedSubcategory) params.append('subcategory_id', selectedSubcategory)
    if (selectedStatus) params.append('status', selectedStatus)
    if (selectedOfficer) params.append('officer_id', selectedOfficer)
    return params
  }, [page, dateFrom, dateTo, selectedCategory, selectedSubcategory, selectedStatus, selectedOfficer])

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = buildQueryParams()
      const res = await api.get(`/reports?${params.toString()}`)
      setReportData(res.data.data)
      if (res.data.meta) {
        setMeta(res.data.meta)
      }
    } catch (err) {
      console.error('Failed to load reports', err)
      setError('Gagal memuat rekapitulasi laporan dari server.')
    } finally {
      setIsLoading(false)
    }
  }, [buildQueryParams])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleResetFilters = () => {
    setDateFrom('')
    setDateTo('')
    setSelectedCategory('')
    setSelectedSubcategory('')
    setSelectedStatus('')
    setSelectedOfficer('')
    setPage(1)
  }

  // Handle Export (Excel / PDF)
  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setIsExporting(format)
    try {
      const params = buildQueryParams()
      params.delete('page')
      params.delete('per_page')
      params.append('format', format)

      const token = localStorage.getItem('hakam_auth_token')
      const response = await fetch(`${API_BASE_URL}/reports/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept:
            format === 'pdf'
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      })

      if (!response.ok) {
        throw new Error('Ekspor gagal')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan-kasus-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export error', err)
      alert(`Gagal mengekspor laporan ke format ${format.toUpperCase()}.`)
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Laporan &amp; Rekapitulasi Perkara
          </h1>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Excel Export */}
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isExporting === 'xlsx' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowDownTrayIcon className="w-4 h-4" />
            )}
            <span>Ekspor Excel</span>
          </button>

          {/* PDF Export */}
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isExporting === 'pdf' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <DocumentArrowDownIcon className="w-4 h-4" />
            )}
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <FunnelIcon className="w-4 h-4 text-blue-600" />
          <span>Filter Parameter Laporan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Tanggal Dari */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Periode Dari
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

          {/* Tanggal Sampai */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Sampai Dengan
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

          {/* Kategori */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Kategori
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

          {/* Subkategori */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Subkategori / Modus
            </label>
            <select
              value={selectedSubcategory}
              disabled={!selectedCategory}
              onChange={(e) => {
                setSelectedSubcategory(e.target.value)
                setPage(1)
              }}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Semua Subkategori</option>
              {availableSubs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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

          {/* Officer & Reset */}
          <div className="flex items-end gap-1.5">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Petugas
              </label>
              <select
                value={selectedOfficer}
                onChange={(e) => {
                  setSelectedOfficer(e.target.value)
                  setPage(1)
                }}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
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

      {/* Summary KPI Cards based on filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FolderOpenIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Berkas Terfilter
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5 block">
              {reportData?.summary.total_cases.toLocaleString('id-ID') || 0}{' '}
              <span className="text-xs font-normal text-slate-500">Kasus</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <BanknotesIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Kerugian Terfilter
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5 block">
              {reportData?.summary.total_loss_formatted || 'Rp 0'}
            </span>
          </div>
        </div>
      </div>

      {/* Data Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-800">
            Pratinjau Data Laporan ({meta.total} baris)
          </h2>
          <p className="text-xs text-slate-500">
            Data berikut akan diekspor sesuai urutan dan kriteria filter yang aktif saat ini.
          </p>
        </div>

        {isLoading ? (
          <SkeletonTable rows={10} cols={7} />
        ) : reportData?.cases && reportData.cases.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <th className="py-3 px-4">No. Kasus</th>
                    <th className="py-3 px-4">Tgl Laporan</th>
                    <th className="py-3 px-4">Nama Pelapor</th>
                    <th className="py-3 px-4">Kategori &amp; Modus</th>
                    <th className="py-3 px-4">Kerugian Material</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {reportData.cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-blue-600 whitespace-nowrap">
                        {c.case_number}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {formatDate(c.report_date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {c.reporter_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">
                          {c.category?.name || '-'}
                        </span>
                        {c.subcategory && (
                          <span className="block text-[11px] text-slate-500">
                            {c.subcategory.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {c.material_loss_formatted}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {c.officer?.name || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
          </>
        ) : (
          <EmptyState
            title="Tidak ada data laporan untuk kriteria ini"
            description="Silakan sesuaikan kembali periode tanggal atau filter klasifikasi Anda."
            isSearch={true}
          />
        )}
      </div>
    </div>
  )
}
