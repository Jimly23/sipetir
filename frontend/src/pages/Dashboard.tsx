import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpenIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
  ArrowRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import api, { formatRupiah, formatDate } from '../services/api'
import { DashboardData } from '../types'
import { StatusBadge } from '../components/common/Badge'
import { SkeletonCard, SkeletonTable } from '../components/common/LoadingSpinner'

export const Dashboard: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<number>(2024) // Default to 2024 where seed data exists
  const [month, setMonth] = useState<string>('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.append('year', year.toString())
      if (month) {
        params.append('month', month)
      }

      const res = await api.get(`/dashboard?${params.toString()}`)
      setData(res.data.data)
    } catch (err: unknown) {
      console.error('Error fetching dashboard', err)
      setError('Gagal memuat data statistik dashboard dari server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [year, month])

  const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4']

  const completedCount =
    data?.status_distribution.find((s) => s.status === 'selesai')?.total || 0
  const totalCases = data?.summary.total_cases || 0
  const completionRate =
    totalCases > 0 ? Math.round((completedCount / totalCases) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Statistik &amp; Pemantauan Kasus
          </h1>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <FunnelIcon className="w-4 h-4 text-slate-400 ml-2" />
          {/* Year Filter */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-xs sm:text-sm font-medium text-slate-700 bg-transparent py-1 px-2 rounded-lg border-0 focus:ring-1 focus:ring-blue-500"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>

          {/* Month Filter */}
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-xs sm:text-sm font-medium text-slate-700 bg-transparent py-1 px-2 rounded-lg border-0 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Bulan</option>
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Kasus */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Kasus Masuk
              </span>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FolderOpenIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {data?.summary.total_cases.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">Laporan</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {month ? `Bulan ke-${month}, ` : 'Periode akumulasi '}
                Tahun {year}
              </span>
            </div>
          </div>

          {/* Total Kerugian Material */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Kerugian Korban
              </span>
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <BanknotesIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {data?.summary.total_loss_formatted}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Akumulasi kerugian finansial terverifikasi
            </p>
          </div>

          {/* Kasus Selesai */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Kasus Selesai
              </span>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {completedCount}
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">Kasus</span>
            </div>
            <div className="mt-2 flex items-center text-xs text-emerald-700 font-medium">
              <span>{completionRate}% tingkat penyelesaian</span>
            </div>
          </div>

          {/* Status Penanganan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sedang Diproses
              </span>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ArrowTrendingUpIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {Math.max(0, totalCases - completedCount)}
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">Kasus Aktif</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Dalam tahap penyelidikan / penyidikan
            </p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Tren Bulanan (Area Chart) - 2 cols on desktop */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Tren Laporan Kasus Per Bulan
              </h2>
              <p className="text-xs text-slate-500">
                Jumlah laporan kasus yang diterima sepanjang tahun {year}
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Memuat grafik tren...
              </div>
            ) : data?.monthly_trend && data.monthly_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.monthly_trend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month_name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val || 0} Kasus`, 'Total Kasus']}
                    labelFormatter={(label) => `Bulan ${label}`}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Tidak ada data tren untuk tahun {year}
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Komposisi Berdasarkan Kategori (Pie Chart) - 1 col on desktop */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              Distribusi Kategori Kejahatan
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Proporsi kejahatan berdasarkan klasifikasi
            </p>
          </div>

          <div className="h-60 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Memuat kategori...
              </div>
            ) : data?.by_category && data.by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.by_category}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.by_category.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val || 0} Kasus`, 'Jumlah']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Tidak ada data kategori
              </div>
            )}
          </div>

          {/* Category legend list */}
          <div className="mt-3 space-y-1.5 pt-3 border-t border-slate-100 max-h-32 overflow-y-auto">
            {data?.by_category.map((cat, idx) => (
              <div key={cat.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-600 truncate">{cat.name}</span>
                </div>
                <span className="font-semibold text-slate-800 shrink-0 ml-2">
                  {cat.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Breakdown Section */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs">
        <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
          Tahapan Status Kasus
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Pemantauan proses penyelidikan dari pelaporan hingga putusan akhir
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data?.status_distribution.map((item) => (
            <div
              key={item.status}
              className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between"
            >
              <StatusBadge status={item.status} className="mb-2 self-start" />
              <div className="mt-1">
                <span className="text-xl font-bold text-slate-800">
                  {item.total}
                </span>
                <span className="text-[11px] text-slate-500 ml-1">kasus</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Cases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              Kasus Terbaru Masuk
            </h2>
            <p className="text-xs text-slate-500">
              10 laporan terakhir yang dicatat dalam sistem
            </p>
          </div>
          <Link
            to="/cases"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Lihat Semua Kasus
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : data?.recent_cases && data.recent_cases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-4">No. Kasus</th>
                  <th className="py-3 px-4">Tgl Laporan</th>
                  <th className="py-3 px-4">Nama Pelapor</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Kerugian Material</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {data.recent_cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-blue-600">
                      {c.case_number}
                    </td>
                    <td className="py-3 px-4">{formatDate(c.report_date)}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {c.reporter_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{c.category}</span>
                      {c.subcategory && (
                        <span className="block text-[11px] text-slate-500">
                          {c.subcategory}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {c.material_loss_formatted}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/cases/${c.id}`}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            Belum ada data kasus terbaru.
          </div>
        )}
      </div>
    </div>
  )
}
